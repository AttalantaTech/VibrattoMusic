import UTIF from "utif";

// Browsers cannot render EPS (it is a PostScript program), but many EPS
// files embed a small raster preview made for this purpose:
// - DOS EPS (binary, Illustrator/CorelDRAW): a TIFF image after a 30-byte
//   header that says where the TIFF is, so only that part is downloaded
// - EPSI (text): a hex bitmap between %%BeginPreview and %%EndPreview
// Files without an embedded preview return null and keep the file card.

const HEADER_SIZE = 30;
// DOS EPS signature: bytes C5 D0 D3 C6 read as a little-endian number
const DOS_EPS_SIGNATURE = 0xc6_d3_d0_c5;
// EPSI previews sit in the comments at the start of the file
const EPSI_SCAN_BYTES = 512 * 1024;
// Guards against corrupted headers asking for huge downloads
const MAX_PREVIEW_BYTES = 10 * 1024 * 1024;

export interface EpsPreviewImage {
	width: number;
	height: number;
	rgba: Uint8ClampedArray;
}

// Reads bytes [start, end] (inclusive) from wherever the file is
export type ByteReader = (start: number, end: number) => Promise<ArrayBuffer>;

// Azure Blob supports HTTP Range: only the requested bytes are downloaded
export const createUrlByteReader =
	(url: string): ByteReader =>
	async (start, end) => {
		const response = await fetch(url, {
			headers: { Range: `bytes=${start}-${end}` },
		});
		if (!response.ok) {
			throw new Error(`EPS preview: request failed (${response.status})`);
		}
		const buffer = await response.arrayBuffer();
		// A server that ignores Range answers 200 with the whole file
		return response.status === 200 ? buffer.slice(start, end + 1) : buffer;
	};

// Local files (before upload) need no network
export const createBlobByteReader =
	(blob: Blob): ByteReader =>
	(start, end) =>
		blob.slice(start, end + 1).arrayBuffer();

const decodeTiff = (buffer: ArrayBuffer): EpsPreviewImage | null => {
	try {
		const [ifd] = UTIF.decode(buffer);
		if (!ifd) return null;

		UTIF.decodeImage(buffer, ifd);
		const width = ifd.width;
		const height = ifd.height;
		if (!width || !height) return null;

		return {
			width,
			height,
			rgba: new Uint8ClampedArray(UTIF.toRGBA8(ifd)),
		};
	} catch {
		return null;
	}
};

// EPSI: "%%BeginPreview: width height depth lines" followed by comment lines
// of hex data, top row first. Samples are inverted: 0 is white and the
// highest value (1 for 1-bit) is black
export const decodeEpsi = (buffer: ArrayBuffer): EpsPreviewImage | null => {
	const text = new TextDecoder("latin1").decode(buffer);
	const begin = /%%BeginPreview:\s*(\d+)\s+(\d+)\s+(\d+)\s+\d+/.exec(text);
	if (!begin) return null;

	const width = Number(begin[1]);
	const height = Number(begin[2]);
	const depth = Number(begin[3]);
	if (!width || !height || ![1, 2, 4, 8].includes(depth)) return null;

	const endIndex = text.indexOf("%%EndPreview", begin.index);
	if (endIndex === -1) return null;

	const hex = text
		.slice(begin.index + begin[0].length, endIndex)
		.replace(/[^0-9a-fA-F]/g, "");
	const bytesPerRow = Math.ceil((width * depth) / 8);
	if (hex.length < bytesPerRow * height * 2) return null;

	const maxValue = (1 << depth) - 1;
	const rgba = new Uint8ClampedArray(width * height * 4);

	for (let row = 0; row < height; row++) {
		for (let column = 0; column < width; column++) {
			const bitOffset = column * depth;
			const byteIndex = row * bytesPerRow + Math.floor(bitOffset / 8);
			const byte = Number.parseInt(
				hex.slice(byteIndex * 2, byteIndex * 2 + 2),
				16
			);
			const shift = 8 - depth - (bitOffset % 8);
			const value = (byte >> shift) & maxValue;
			const gray = 255 - Math.round((value * 255) / maxValue);

			const pixel = (row * width + column) * 4;
			rgba[pixel] = gray;
			rgba[pixel + 1] = gray;
			rgba[pixel + 2] = gray;
			rgba[pixel + 3] = 255;
		}
	}

	return { width, height, rgba };
};

export const extractEpsPreview = async (
	read: ByteReader
): Promise<EpsPreviewImage | null> => {
	const header = new DataView(await read(0, HEADER_SIZE - 1));

	if (
		header.byteLength >= HEADER_SIZE &&
		header.getUint32(0, true) === DOS_EPS_SIGNATURE
	) {
		const postScriptOffset = header.getUint32(4, true);
		const tiffOffset = header.getUint32(20, true);
		const tiffLength = header.getUint32(24, true);

		if (tiffOffset > 0 && tiffLength > 0 && tiffLength <= MAX_PREVIEW_BYTES) {
			const preview = decodeTiff(
				await read(tiffOffset, tiffOffset + tiffLength - 1)
			);
			if (preview) return preview;
		}

		// No usable TIFF: the PostScript part may still carry an EPSI preview
		return decodeEpsi(
			await read(postScriptOffset, postScriptOffset + EPSI_SCAN_BYTES - 1)
		);
	}

	return decodeEpsi(await read(0, EPSI_SCAN_BYTES - 1));
};

// Browser only: turns the decoded pixels into an image the <img> can show
export const epsPreviewToDataUrl = (preview: EpsPreviewImage): string => {
	const canvas = document.createElement("canvas");
	canvas.width = preview.width;
	canvas.height = preview.height;
	const context = canvas.getContext("2d");
	if (!context) return "";

	// The copy gives ImageData the plain ArrayBuffer-backed array it requires
	const pixels = new Uint8ClampedArray(preview.rgba);
	context.putImageData(
		new ImageData(pixels, preview.width, preview.height),
		0,
		0
	);
	return canvas.toDataURL("image/png");
};

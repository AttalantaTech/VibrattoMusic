import type { FileEventType } from "@/api/types";

/**
 * Photos are sent no bigger than the screen needs. A phone photo has
 * 3000–4000 px and 1–5 MB; the profile photo is shown at most 300 px wide
 * and the header avatar at 32 px, yet every page downloaded the whole file
 */

// Profile photos and logos: twice the largest place they are shown (~300 px)
const PHOTO_MAX_SIDE = 800;
// Gallery and promotional pictures: they open full screen in the viewer
const GALLERY_MAX_SIDE = 1920;
// Below this the gain doesn't pay for the work
const SMALL_FILE = 200 * 1024;
const JPEG_QUALITY = 0.85;

/**
 * The largest side allowed for a file sent as this event, or null when the
 * file goes as it is: rider, dressing room and stage map are documents
 */
export const maxSideFor = (evento: FileEventType): number | null => {
	if (evento === "UsuarioFotoPerfil" || /FotoPerfil$|Logomarca$/.test(evento))
		return PHOTO_MAX_SIDE;
	if (/Carrossel$|Clipagem$/.test(evento)) return GALLERY_MAX_SIDE;
	return null;
};

/**
 * Only photos the browser can redraw. GIF would lose its animation and SVG
 * is already light; anything else (PDF, EPS, video) isn't a picture
 */
export const canShrink = (type: string): boolean =>
	["image/jpeg", "image/png", "image/webp"].includes(type);

/** The size that fits in maxSide keeping the proportion, never larger */
export const fitWithin = (
	width: number,
	height: number,
	maxSide: number
): { width: number; height: number } => {
	const scale = Math.min(1, maxSide / Math.max(width, height));

	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
};

/**
 * PNG stays PNG (it may be a logo with a transparent background); JPEG and
 * WebP become JPEG, which every browser can write
 */
export const outputOf = (
	type: string,
	name: string
): { type: string; name: string } => {
	if (type === "image/png") return { type, name };

	const base = name.replace(/\.[^.]+$/, "");
	return { type: "image/jpeg", name: `${base || "foto"}.jpg` };
};

/**
 * The photo redrawn within maxSide. The original comes back whenever the
 * shrink isn't possible or doesn't help: the upload must never fail here
 */
export const shrinkImage = async (
	file: File,
	maxSide: number
): Promise<File> => {
	if (!canShrink(file.type) || typeof createImageBitmap !== "function")
		return file;

	try {
		// from-image: phone photos are stored sideways with an orientation
		// note; the redrawn file has no note, so the turn is applied here
		const bitmap = await createImageBitmap(file, {
			imageOrientation: "from-image",
		});
		const target = fitWithin(bitmap.width, bitmap.height, maxSide);
		const isAlreadySmall =
			target.width === bitmap.width && file.size <= SMALL_FILE;

		if (isAlreadySmall) {
			bitmap.close();
			return file;
		}

		const canvas = document.createElement("canvas");
		canvas.width = target.width;
		canvas.height = target.height;
		const context = canvas.getContext("2d");
		if (!context) {
			bitmap.close();
			return file;
		}

		const output = outputOf(file.type, file.name);
		if (output.type === "image/jpeg") {
			// A transparent WebP would turn black as JPEG
			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, target.width, target.height);
		}
		context.imageSmoothingQuality = "high";
		context.drawImage(bitmap, 0, 0, target.width, target.height);
		bitmap.close();

		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, output.type, JPEG_QUALITY);
		});
		if (!blob || blob.size >= file.size) return file;

		return new File([blob], output.name, {
			type: output.type,
			lastModified: file.lastModified,
		});
	} catch {
		// HEIC and other formats the browser can't open go as they are
		return file;
	}
};

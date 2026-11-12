/**
 * Thumbnails of PDFs already drawn on this device. Drawing the first page of
 * a heavy file means downloading most of it; kept here, the next visit shows
 * the picture at once and downloads nothing
 */

const CACHE_NAME = "pdf-thumbnails-v1";
const LENGTH_HEADER = "X-File-Length";
const LONG_PAGE_HEADER = "X-Long-Page";

/** Height over width past which a page is a long strip, not a sheet */
export const LONG_PAGE_RATIO = 2.5;
// What is kept of a long page: its top, a little taller than the box
const LONG_PAGE_KEPT_RATIO = 1.5;

export interface PdfThumbnail {
	/** Address of the picture, to be released with URL.revokeObjectURL */
	src: string;
	/** The top of a long page: fills the box instead of fitting in it */
	isLongPage: boolean;
}

/** The part of the drawn page worth keeping as its thumbnail */
export const thumbnailCrop = (width: number, height: number) => {
	const isLongPage = height / width > LONG_PAGE_RATIO;

	return {
		width,
		height: isLongPage ? Math.round(width * LONG_PAGE_KEPT_RATIO) : height,
		isLongPage,
	};
};

// Only on https (and localhost); private windows may refuse it
const openCache = async (): Promise<Cache | null> => {
	try {
		return typeof caches === "undefined" ? null : await caches.open(CACHE_NAME);
	} catch {
		return null;
	}
};

/**
 * The thumbnail kept for this file, if any. fileLength, when known, tells a
 * file that was replaced under the same address: its thumbnail is dropped
 */
export const readPdfThumbnail = async (
	url: string,
	fileLength: number | null
): Promise<PdfThumbnail | null> => {
	try {
		const cache = await openCache();
		const saved = await cache?.match(url);
		if (!cache || !saved) return null;

		const savedLength = Number(saved.headers.get(LENGTH_HEADER));
		if (fileLength && savedLength && savedLength !== fileLength) {
			await cache.delete(url);
			return null;
		}

		return {
			src: URL.createObjectURL(await saved.blob()),
			isLongPage: saved.headers.get(LONG_PAGE_HEADER) === "1",
		};
	} catch {
		return null;
	}
};

/** Keeps the page just drawn as the file's thumbnail. Never fails the page */
export const savePdfThumbnail = async (
	url: string,
	fileLength: number | null,
	drawn: HTMLCanvasElement
): Promise<void> => {
	try {
		const cache = await openCache();
		if (!cache || drawn.width === 0 || drawn.height === 0) return;

		const crop = thumbnailCrop(drawn.width, drawn.height);
		const picture = document.createElement("canvas");
		picture.width = crop.width;
		picture.height = crop.height;
		const context = picture.getContext("2d");
		if (!context) return;
		// White behind: a JPEG has no transparency
		context.fillStyle = "#ffffff";
		context.fillRect(0, 0, crop.width, crop.height);
		context.drawImage(drawn, 0, 0);

		const blob = await new Promise<Blob | null>((resolve) => {
			picture.toBlob(resolve, "image/jpeg", 0.82);
		});
		if (!blob) return;

		await cache.put(
			url,
			new Response(blob, {
				headers: {
					"Content-Type": "image/jpeg",
					[LENGTH_HEADER]: String(fileLength ?? 0),
					[LONG_PAGE_HEADER]: crop.isLongPage ? "1" : "0",
				},
			})
		);
	} catch {
		// No room or no permission: the thumbnail is drawn again next time
	}
};

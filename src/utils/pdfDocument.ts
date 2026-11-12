import type * as PdfjsLibrary from "pdfjs-dist/legacy/build/pdf.mjs";

type Pdfjs = typeof PdfjsLibrary;

let pdfjs: Promise<Pdfjs> | undefined;

// pdf.js is large and only the browsers that can't show a PDF by themselves
// need it, so it is downloaded on first use. The legacy build runs on the
// older phones too
export const loadPdfjs = (): Promise<Pdfjs> => {
	pdfjs ??= Promise.all([
		import("pdfjs-dist/legacy/build/pdf.mjs"),
		import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
	]).then(([library, worker]) => {
		library.GlobalWorkerOptions.workerSrc = worker.default;
		return library;
	});

	return pdfjs;
};

// Phones don't show a PDF inside the page: Android reports it through
// pdfViewerEnabled (the iframe stays an empty box) and iOS draws the first
// page only, with no scrolling. iPadOS identifies itself as a Mac
export const needsOwnPdfRenderer = (): boolean => {
	if (typeof navigator === "undefined") return false;
	if (navigator.pdfViewerEnabled === false) return true;

	return (
		/iP(hone|ad|od)/.test(navigator.userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
	);
};

// Safari leaves the PDF box blank when a file it already showed comes back
// (e.g. returning to a tab of the profile) unless the address changes. Only
// Safari: a changed address makes every browser download the file again
export const needsFreshPdfAddress = (): boolean => {
	if (typeof navigator === "undefined") return false;

	return (
		/safari/i.test(navigator.userAgent) &&
		!/chrome|chromium|crios|fxios|edg|opr|android/i.test(navigator.userAgent)
	);
};

// Size of a file in the storage, when it tells (a HEAD, no content)
export const pdfFileLength = async (url: string): Promise<number | null> => {
	if (!/^https?:/i.test(url)) return null;

	try {
		const response = await fetch(url, { method: "HEAD" });
		const length = Number(response.headers.get("Content-Length"));
		return response.ok && length > 0 ? length : null;
	} catch {
		return null;
	}
};

/**
 * Opens a PDF to be drawn by the page. Files in the storage are read in
 * pieces (HTTP Range), only what the pages on screen need: a media kit can
 * have tens of MB, too much to download for a thumbnail on a phone. pdf.js
 * would do it by itself, but the storage doesn't expose Accept-Ranges to it.
 *
 * readLimit is for thumbnails: what counts is how much the first page asks
 * for, not the size of the file (the first page of a 60 MB media kit usually
 * takes a fraction of it). Past maxBytes the reading stops and onExceeded
 * is called
 */
export const openPdf = async (
	link: string,
	options: {
		readLimit?: { maxBytes: number; onExceeded: () => void };
		/** The size of the file, when the caller has already asked for it */
		fileLength?: number | null;
	} = {}
) => {
	const { readLimit } = options;
	const library = await loadPdfjs();
	// The #toolbar=0 some links carry is for the browser's own viewer
	const url = link.split("#")[0] ?? link;

	const length =
		options.fileLength === undefined
			? await pdfFileLength(url)
			: options.fileLength;
	if (!length) return library.getDocument({ url });

	const transport = new library.PDFDataRangeTransport(length, null);
	const loadingTask = library.getDocument({
		range: transport,
		disableAutoFetch: true,
		disableStream: true,
	});

	let bytesRead = 0;

	transport.requestDataRange = (begin, end) => {
		bytesRead += end - begin;
		if (readLimit && bytesRead > readLimit.maxBytes) {
			readLimit.onExceeded();
			loadingTask.destroy().catch(() => undefined);
			return;
		}

		fetch(url, { headers: { Range: `bytes=${begin}-${end - 1}` } })
			.then((response) => {
				// A server that ignores Range answers 200 with the whole file
				if (response.status !== 206) throw new Error("Range not supported");
				return response.arrayBuffer();
			})
			.then((buffer) => {
				transport.onDataRange(begin, new Uint8Array(buffer));
			})
			.catch(() => {
				// Ends the loading: its promise rejects and the viewer falls back
				loadingTask.destroy().catch(() => undefined);
			});
	};

	return loadingTask;
};

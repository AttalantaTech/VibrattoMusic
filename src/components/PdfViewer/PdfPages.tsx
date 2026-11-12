import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
	needsOwnPdfRenderer,
	openPdf,
	pdfFileLength,
} from "@/utils/pdfDocument";
import {
	LONG_PAGE_RATIO,
	readPdfThumbnail,
	savePdfThumbnail,
	type PdfThumbnail,
} from "@/utils/pdfThumbnailCache";

interface PdfPagesProps {
	src: string;
	title: string;
	/** The first page only, fitted to the box: a thumbnail */
	firstPageOnly?: boolean;
	className?: string;
	onLoad?: () => void;
	/**
	 * The file couldn't be read (e.g. the storage refused the request) or, for
	 * a thumbnail, is too large to be worth reading (its size comes along)
	 */
	onError: (
		reason: "too-large" | "unreadable",
		fileLength?: number | null
	) => void;
}

// Sharp on phone screens without drawing more pixels than they can hold
const MAX_PIXEL_RATIO = 2;
// The most a thumbnail may download. A first page that asks for more (a
// media kit's cover can take tens of MB) isn't worth it on a phone's data
// plan: there the file shows as a card and is only read when opened.
// Computers draw it anyway, up to a size no first page should reach
const MEGABYTE = 1024 * 1024;
const maxThumbnailBytes = () =>
	needsOwnPdfRenderer() ? 10 * MEGABYTE : 100 * MEGABYTE;

interface PdfPageProps {
	document: PDFDocumentProxy;
	pageNumber: number;
	width: number;
	label: string;
	fit?: boolean;
	onRendered?: (drawn: HTMLCanvasElement) => void;
}

// One page, drawn when it gets near the screen: a long file would otherwise
// draw every page at once
const PdfPage = ({
	document,
	pageNumber,
	width,
	label,
	fit = false,
	onRendered,
}: PdfPageProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isNear, setIsNear] = useState(false);
	// Until the page is read, the proportion of an A4 sheet holds its place
	const [ratio, setRatio] = useState(1.414);
	const [isDrawn, setIsDrawn] = useState(false);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setIsNear(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "600px 0px" }
		);
		observer.observe(canvas);

		return () => {
			observer.disconnect();
		};
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !isNear || width <= 0) return;

		let cancelled = false;
		let renderTask: { cancel: () => void } | undefined;

		const draw = async () => {
			const page = await document.getPage(pageNumber);
			if (cancelled) return;

			const base = page.getViewport({ scale: 1 });
			setRatio(base.height / base.width);

			const pixelRatio = Math.min(
				window.devicePixelRatio || 1,
				MAX_PIXEL_RATIO
			);
			const viewport = page.getViewport({
				scale: (width / base.width) * pixelRatio,
			});
			canvas.width = Math.floor(viewport.width);
			canvas.height = Math.floor(viewport.height);

			const task = page.render({ canvas, viewport });
			renderTask = task;
			await task.promise;
			if (cancelled) return;
			setIsDrawn(true);
			onRendered?.(canvas);
		};

		// A cancelled drawing (the page left, the width changed) rejects too
		draw().catch(() => undefined);

		return () => {
			cancelled = true;
			renderTask?.cancel();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [document, pageNumber, width, isNear]);

	return (
		<div className={fit ? "relative h-full w-full" : "relative w-full"}>
			<canvas
				ref={canvasRef}
				role="img"
				aria-label={label}
				className={
					fit
						? // A whole media kit laid out as one very long page would be
							// a thin strip: its top fills the box instead
							ratio > LONG_PAGE_RATIO
							? "h-full w-full bg-white object-cover object-top"
							: "h-full w-full bg-white object-contain"
						: "block w-full bg-white shadow-sm"
				}
				style={fit ? undefined : { aspectRatio: `1 / ${ratio}` }}
			/>
			{/* A heavy page takes a while: without this it is a blank sheet. Near
			    the top, as the middle of a very tall page is off the screen */}
			{!isDrawn && (
				<div
					className={
						fit
							? "absolute inset-0 flex items-center justify-center"
							: "absolute inset-x-0 top-0 flex items-center justify-center gap-2 pt-12 text-sm text-gray-500"
					}
				>
					<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
					{!fit && "Carregando página..."}
				</div>
			)}
		</div>
	);
};

/**
 * The PDF drawn by the page itself (pdf.js), for the browsers that don't show
 * one in an iframe. As tall as its pages, up to most of the screen, and
 * scrolls inside
 */
export const PdfPages = ({
	src,
	title,
	firstPageOnly = false,
	className = "",
	onLoad,
	onError,
}: PdfPagesProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
	const [width, setWidth] = useState(0);
	// The thumbnail this device already drew for the file, shown as a picture
	const [thumbnail, setThumbnail] = useState<PdfThumbnail | null>(null);
	const fileLength = useRef<number | null>(null);
	// The #toolbar=0 some links carry is not part of the file's address
	const fileUrl = src.split("#")[0] ?? src;

	useEffect(() => {
		let cancelled = false;
		let loadingTask: { destroy: () => Promise<void> } | undefined;
		let shownThumbnail: PdfThumbnail | null = null;
		setDocument(null);
		setThumbnail(null);

		// Reported once, whether it happens while opening or while drawing
		let tooLarge = false;
		const readLimit = {
			maxBytes: maxThumbnailBytes(),
			onExceeded: () => {
				if (tooLarge) return;
				tooLarge = true;
				if (!cancelled) onError("too-large", fileLength.current);
			},
		};

		const open = async () => {
			if (!firstPageOnly) return openPdf(src);

			const length = await pdfFileLength(fileUrl);
			fileLength.current = length;

			const kept = await readPdfThumbnail(fileUrl, length);
			if (kept) {
				if (cancelled) {
					URL.revokeObjectURL(kept.src);
				} else {
					shownThumbnail = kept;
					setThumbnail(kept);
					onLoad?.();
				}
				return undefined;
			}

			return openPdf(src, { readLimit, fileLength: length });
		};

		open()
			.then((task) => {
				// The kept thumbnail is on screen: the file isn't opened
				if (!task) return undefined;

				loadingTask = task;
				// Left before the file was opened: nothing to wait for
				if (cancelled) {
					task.destroy().catch(() => undefined);
					return undefined;
				}
				return task.promise;
			})
			.then((loaded) => {
				if (loaded && !cancelled) setDocument(loaded);
			})
			.catch(() => {
				if (!cancelled && !tooLarge) onError("unreadable");
			});

		return () => {
			cancelled = true;
			loadingTask?.destroy().catch(() => undefined);
			if (shownThumbnail) URL.revokeObjectURL(shownThumbnail.src);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [src]);

	// Pages follow the box's width (e.g. when the phone is turned)
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const measure = () => {
			setWidth(Math.round(container.clientWidth));
		};
		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(container);

		return () => {
			observer.disconnect();
		};
	}, []);

	const pageNumbers = document
		? Array.from(
				{ length: firstPageOnly ? 1 : document.numPages },
				(_, index) => index + 1
			)
		: [];

	if (firstPageOnly) {
		return (
			<div
				ref={containerRef}
				className={`flex items-center justify-center overflow-hidden bg-white ${className}`}
			>
				{thumbnail ? (
					<img
						src={thumbnail.src}
						alt={title}
						className={
							thumbnail.isLongPage
								? "h-full w-full bg-white object-cover object-top"
								: "h-full w-full bg-white object-contain"
						}
					/>
				) : document ? (
					<PdfPage
						document={document}
						pageNumber={1}
						width={width}
						label={title}
						fit
						onRendered={(drawn) => {
							onLoad?.();
							// Kept for the next visit, which then downloads nothing
							void savePdfThumbnail(fileUrl, fileLength.current, drawn);
						}}
					/>
				) : (
					<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
				)}
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="max-h-[70dvh] w-full space-y-2 overflow-y-auto overscroll-contain bg-gray-100"
		>
			{document ? (
				pageNumbers.map((pageNumber) => (
					<PdfPage
						key={pageNumber}
						document={document}
						pageNumber={pageNumber}
						width={width}
						label={`${title}, página ${pageNumber} de ${document.numPages}`}
						onRendered={pageNumber === 1 ? () => onLoad?.() : undefined}
					/>
				))
			) : (
				<div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
					<Loader2 className="h-5 w-5 animate-spin text-gray-400" />
					Carregando PDF...
				</div>
			)}
		</div>
	);
};

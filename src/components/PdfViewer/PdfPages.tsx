import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { openPdf } from "@/utils/pdfDocument";

interface PdfPagesProps {
	src: string;
	title: string;
	/** The first page only, fitted to the box: a thumbnail */
	firstPageOnly?: boolean;
	className?: string;
	onLoad?: () => void;
	/** The file couldn't be read (e.g. the storage refused the request) */
	onError: () => void;
}

// Sharp on phone screens without drawing more pixels than they can hold
const MAX_PIXEL_RATIO = 2;
// A thumbnail isn't worth a heavy download on a phone: past this the file
// shows as a card and is only read when opened
const MAX_THUMBNAIL_BYTES = 10 * 1024 * 1024;

interface PdfPageProps {
	document: PDFDocumentProxy;
	pageNumber: number;
	width: number;
	label: string;
	fit?: boolean;
	onRendered?: () => void;
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
			onRendered?.();
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
						? "h-full w-full bg-white object-contain"
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

	useEffect(() => {
		let cancelled = false;
		let loadingTask: { destroy: () => Promise<void> } | undefined;
		setDocument(null);

		openPdf(src, firstPageOnly ? MAX_THUMBNAIL_BYTES : undefined)
			.then((task) => {
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
				if (!cancelled) onError();
			});

		return () => {
			cancelled = true;
			loadingTask?.destroy().catch(() => undefined);
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
				{document ? (
					<PdfPage
						document={document}
						pageNumber={1}
						width={width}
						label={title}
						fit
						onRendered={onLoad}
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
						onRendered={pageNumber === 1 ? onLoad : undefined}
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

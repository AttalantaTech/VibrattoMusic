import { useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import { needsOwnPdfRenderer } from "@/utils/pdfDocument";
import { PdfPages } from "./PdfPages";
import { fileSizeInMB } from "@/common/utils";

interface PdfViewerProps {
	src: string;
	title: string;
	/** Size of the iframe and of the thumbnail's box */
	className?: string;
	/**
	 * A thumbnail: the first page only, with nothing to click. Drawn by the
	 * page on every device, which reads just the piece of the file that page
	 * needs; the browser's viewer would download the whole file for it
	 */
	preview?: boolean;
	/**
	 * What to do with a thumbnail that couldn't be drawn (e.g. "Toque para
	 * abrir"), where the file opens when it is pressed
	 */
	previewHint?: string;
	onLoad?: () => void;
}

const openInReader = (link: string) => {
	window.open(link.split("#")[0], "_blank", "noopener,noreferrer");
};

// Computers show the PDF in the browser's own viewer. Phones can't (Android
// leaves an empty box, iOS shows the first page only), so there the pages are
// drawn by the page itself; if the file can't be read that way either, the
// viewer becomes a button that opens it in the phone's reader
export const PdfViewer = ({
	src,
	title,
	className,
	preview = false,
	previewHint,
	onLoad,
}: PdfViewerProps) => {
	const [fileLength, setFileLength] = useState<number | null>(null);
	const [failure, setFailure] = useState<"too-large" | "unreadable" | null>(
		null
	);
	useEffect(() => {
		setFailure(null);
	}, [src]);
	const failed = failure !== null;

	const handleError = (
		reason: "too-large" | "unreadable",
		length?: number | null
	) => {
		setFailure(reason);
		setFileLength(length ?? null);
		// The browser's viewer, shown next, tells when it has loaded
		if (reason === "unreadable" && preview && !needsOwnPdfRenderer()) return;
		onLoad?.();
	};

	const browserViewer = (
		<iframe src={src} className={className} title={title} onLoad={onLoad} />
	);

	if (preview) {
		// The thumbnail couldn't be drawn here, but this browser can show the
		// file by itself: better the whole download than no thumbnail
		if (failure === "unreadable" && !needsOwnPdfRenderer()) {
			return browserViewer;
		}

		return failed ? (
			<div
				className={`flex flex-col items-center justify-center gap-1 bg-gray-50 ${className ?? ""}`}
			>
				<FileText className="h-10 w-10 text-gray-400" aria-hidden="true" />
				<span className="text-sm font-semibold text-gray-600">Arquivo PDF</span>
				{fileLength ? (
					<span className="text-xs text-gray-500">
						{fileSizeInMB(fileLength)}
					</span>
				) : null}
				{previewHint && (
					<span className="mt-1 text-xs font-medium text-primary-600">
						{previewHint}
					</span>
				)}
			</div>
		) : (
			<PdfPages
				src={src}
				title={title}
				className={className}
				firstPageOnly
				onLoad={onLoad}
				onError={handleError}
			/>
		);
	}

	if (!needsOwnPdfRenderer()) return browserViewer;

	if (failed) {
		return (
			<div className="flex w-full flex-col items-center justify-center gap-3 bg-gray-50 px-6 py-10 text-center">
				<FileText className="h-10 w-10 text-gray-400" />
				<p className="text-sm text-gray-600">
					Não foi possível exibir o PDF dentro da página.
				</p>
				<Button
					className="gap-2"
					onClick={() => {
						openInReader(src);
					}}
				>
					<ExternalLink className="h-4 w-4" />
					Abrir PDF
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full">
			<PdfPages src={src} title={title} onLoad={onLoad} onError={handleError} />
			<button
				type="button"
				className="flex w-full items-center justify-center gap-2 border-t border-gray-200 bg-white py-2 text-sm font-medium text-primary-600"
				onClick={() => {
					openInReader(src);
				}}
			>
				<ExternalLink className="h-4 w-4" />
				Abrir PDF em tela cheia
			</button>
		</div>
	);
};

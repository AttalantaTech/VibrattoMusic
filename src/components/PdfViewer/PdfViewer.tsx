import { useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import { needsOwnPdfRenderer } from "@/utils/pdfDocument";
import { PdfPages } from "./PdfPages";

interface PdfViewerProps {
	src: string;
	title: string;
	/** Size of the iframe and of the thumbnail's box */
	className?: string;
	/** A thumbnail: the first page only, with nothing to click */
	preview?: boolean;
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
	onLoad,
}: PdfViewerProps) => {
	const [failed, setFailed] = useState(false);
	useEffect(() => {
		setFailed(false);
	}, [src]);

	const handleError = () => {
		setFailed(true);
		onLoad?.();
	};

	if (!needsOwnPdfRenderer()) {
		return (
			<iframe src={src} className={className} title={title} onLoad={onLoad} />
		);
	}

	if (preview) {
		return failed ? (
			<div
				className={`flex flex-col items-center justify-center gap-1 bg-gray-50 ${className ?? ""}`}
			>
				<FileText className="h-10 w-10 text-gray-400" aria-hidden="true" />
				<span className="text-sm font-semibold text-gray-600">Arquivo PDF</span>
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

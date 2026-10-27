import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";

interface PdfViewerProps {
	src: string;
	title: string;
	className?: string;
}

// Browsers that can't render a PDF inside the page (Android Chrome) show an
// empty dark box in the iframe; they report it through pdfViewerEnabled, so
// there the viewer becomes a button that opens the file in the phone's reader
export const PdfViewer = ({ src, title, className }: PdfViewerProps) => {
	const canEmbedPdf =
		typeof navigator === "undefined" || navigator.pdfViewerEnabled !== false;

	if (canEmbedPdf) {
		return <iframe src={src} className={className} title={title} />;
	}

	return (
		<div className="flex flex-col items-center justify-center gap-3 bg-gray-50 px-6 py-10 text-center">
			<FileText className="h-10 w-10 text-gray-400" />
			<p className="text-sm text-gray-600">
				Seu navegador não exibe o PDF dentro da página.
			</p>
			<Button
				className="gap-2"
				onClick={() => {
					window.open(src.split("#")[0], "_blank", "noopener,noreferrer");
				}}
			>
				<ExternalLink className="h-4 w-4" />
				Abrir PDF
			</Button>
		</div>
	);
};

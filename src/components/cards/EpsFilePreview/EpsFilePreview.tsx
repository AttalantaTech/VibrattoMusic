import { Download, FileImage, Loader2 } from "lucide-react";
import { useEpsPreview } from "@/hooks/useEpsPreview";

interface EpsFilePreviewProps {
	link: string;
	// Shows a download link; off where the tile itself is clickable (carousels)
	showDownload?: boolean;
	className?: string;
}

const DownloadLink = ({ link }: { link: string }) => (
	<a
		href={link}
		target="_blank"
		rel="noopener noreferrer"
		download
		onClick={(event) => {
			event.stopPropagation();
		}}
		className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
	>
		<Download className="w-4 h-4" />
		Baixar arquivo
	</a>
);

// Browsers cannot render EPS (vector/PostScript). When the file embeds a
// raster preview it is shown; otherwise the file appears as a card. Either
// way the original EPS can be downloaded
export const EpsFilePreview = ({
	link,
	showDownload = false,
	className = "",
}: EpsFilePreviewProps) => {
	const { data: previewUrl, isLoading } = useEpsPreview(link);

	if (isLoading) {
		return (
			<div
				className={`flex items-center justify-center w-full h-full bg-gray-50 ${className}`}
			>
				<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
			</div>
		);
	}

	if (previewUrl) {
		return (
			<div
				className={`relative flex flex-col items-center justify-center gap-2 w-full h-full bg-white ${className}`}
			>
				<img
					src={previewUrl}
					alt="Pré-visualização do arquivo EPS"
					className="min-h-0 w-full flex-1 object-contain"
				/>
				<span className="absolute top-2 left-2 rounded bg-gray-900/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
					EPS
				</span>
				{showDownload && (
					<div className="pb-2">
						<DownloadLink link={link} />
					</div>
				)}
			</div>
		);
	}

	return (
		<div
			className={`flex flex-col items-center justify-center gap-2 w-full h-full p-4 bg-gray-50 text-center ${className}`}
		>
			<FileImage className="w-10 h-10 text-primary-600" aria-hidden="true" />
			<span className="text-sm font-semibold text-gray-700">Arquivo EPS</span>
			<span className="text-xs text-gray-500">
				Arquivo vetorial, sem pré-visualização
			</span>
			{showDownload && (
				<div className="mt-1">
					<DownloadLink link={link} />
				</div>
			)}
		</div>
	);
};

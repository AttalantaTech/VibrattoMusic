import { Loader2 } from "lucide-react";
import { uploadPercent, type FileUpload } from "../../utils/uploadProgress";

/**
 * Holds the place of a file being sent, among the files already added: how
 * much was sent so far, so a heavy file doesn't look like nothing happened
 */
export function UploadingTile({ upload }: { upload: FileUpload }) {
	const percent = uploadPercent(upload);
	// Everything was sent; the storage is confirming and the list being saved
	const isFinishing = percent >= 100;

	return (
		<div className="px-1">
			<div
				className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary-200 bg-primary-50 p-3 text-center"
				role="status"
				aria-live="polite"
			>
				<Loader2 className="h-5 w-5 animate-spin text-primary-600" />
				<span className="text-sm font-semibold text-primary-800">
					{isFinishing ? "Finalizando..." : `Enviando ${percent}%`}
				</span>
				<div
					className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100"
					role="progressbar"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={percent}
					aria-label={`Envio de ${upload.name}`}
				>
					<div
						className="h-full rounded-full bg-primary-600 transition-[width] duration-200"
						style={{ width: `${percent}%` }}
					/>
				</div>
				<span className="w-full truncate text-xs text-gray-600">
					{upload.name}
				</span>
			</div>
		</div>
	);
}

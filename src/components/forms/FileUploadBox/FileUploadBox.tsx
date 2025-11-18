import { CloudUpload } from "lucide-react";
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import type { FileInfo } from "../../../common/types";
import { fileSizeInMB } from "../../../common/utils";

type FileType =
	| "image/png"
	| "image/jpeg"
	| "image/gif"
	| "image/svg+xml"
	| "video/mp4"
	| "application/pdf";

interface SingleFileInputProps {
	acceptedTypes?: Array<FileType>;
	onFileSelected?: (file: File | null) => void;
	maxSizeMB?: number;
	className?: string;
}

export const FileUploadBox = ({
	acceptedTypes = ["image/png", "image/jpeg"],
	onFileSelected,
	maxSizeMB = 5,
	className = "",
}: SingleFileInputProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	const validateFile = (file: File): boolean => {
		// Check file type
		if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
			setError(`Tipo de arquivo não permitido.`);
			return false;
		}

		// Check file size (MB to bytes)
		const maxSizeBytes = maxSizeMB * 1024 * 1024;
		if (file.size > maxSizeBytes) {
			setError(`Arquivo grande demais`);
			return false;
		}

		setError(null);
		return true;
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] || null;

		if (file && validateFile(file)) {
			setCurrentFile({
				name: file.name,
				size: fileSizeInMB(file.size),
			});
			onFileSelected?.(file);
		} else {
			onFileSelected?.(null);
		}

		// Reset input to allow selecting the same file again
		if (event.target) {
			event.target.value = "";
		}
	};

	const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);

		const file = event.dataTransfer.files?.[0] || null;

		if (file && validateFile(file)) {
			setCurrentFile({
				name: file.name,
				size: fileSizeInMB(file.size),
			});
			onFileSelected?.(file);
		} else {
			onFileSelected?.(null);
		}
	};

	const acceptString = acceptedTypes.join(",");

	return (
		<div
			className={`flex flex-col w-full items-center justify-center gap-2 ${className}`}
		>
			{/* Main Upload Box */}
			<div
				className={`flex flex-col justify-center items-center bg-white border text-gray-500 gap-4 py-6 px-5 w-full transition-colors rounded-lg cursor-pointer ${
					isDragging
						? "border-blue-500 bg-blue-50"
						: "border-gray-200 hover:border-gray-300"
				} ${error ? "border-red-500" : ""}`}
				onClick={triggerFileInput}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<div className="bg-gray-100 h-12 w-12 flex items-center justify-center">
					<CloudUpload className="text-gray-500" size={24} />
				</div>
				<div className="flex flex-col gap-1 w-full items-center text-center">
					<p>
						<span
							className="font-semibold text-[#085ec5] cursor-pointer"
							onClick={triggerFileInput}
						>
							Clique aqui{" "}
						</span>
						ou arraste e solte
					</p>
					<p className="text-xs text-gray-400">
						{acceptedTypes.map((t) => t.split("/")[1]).join(", ")} (max.{" "}
						{maxSizeMB}MB)
					</p>
					{currentFile && (
						<p>
							{currentFile.name}: {currentFile.size}
						</p>
					)}
				</div>
			</div>

			{error && <p className="text-sm text-red-500 mt-1">{error}</p>}

			<input
				ref={fileInputRef}
				accept={acceptString}
				className="hidden"
				type="file"
				onChange={handleFileChange}
			/>
		</div>
	);
};

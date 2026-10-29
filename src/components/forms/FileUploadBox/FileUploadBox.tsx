import { CloudUpload } from "lucide-react";
import { useState, useRef, type ChangeEvent, type DragEvent } from "react";
import type { FileInfo } from "../../../common/types";
import { fileSizeInMB } from "../../../common/utils";

type FileType =
	| "image/png"
	| "image/jpeg"
	| "image/jpg"
	| "image/gif"
	| "image/svg+xml"
	| "video/mp4"
	| "application/pdf";

interface SingleFileInputProps {
	acceptedTypes?: Array<FileType>;
	// Extensions such as ".eps", for formats whose MIME type browsers report
	// inconsistently (EPS may come as "application/postscript", "image/x-eps"
	// or even empty on Windows)
	acceptedExtensions?: Array<`.${string}`>;
	onFileSelected?: (file: File | null) => void;
	// With multiple, every valid file is handed over at once, so the caller
	// can save the whole batch in a single request
	multiple?: boolean;
	onFilesSelected?: (files: Array<File>) => void;
	maxSizeMB?: number;
	className?: string;
}

export const FileUploadBox = ({
	acceptedTypes = ["image/png", "image/jpeg"],
	acceptedExtensions = [],
	onFileSelected,
	multiple = false,
	onFilesSelected,
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
		// Check file type: by MIME type or, for the listed formats, by extension
		const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
		const isAcceptedType =
			acceptedTypes.includes(file.type as FileType) ||
			acceptedExtensions.includes(extension as `.${string}`);

		if (
			acceptedTypes.length + acceptedExtensions.length > 0 &&
			!isAcceptedType
		) {
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

	const isFileAccepted = (file: File): boolean => {
		const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
		const isAcceptedType =
			acceptedTypes.length + acceptedExtensions.length === 0 ||
			acceptedTypes.includes(file.type as FileType) ||
			acceptedExtensions.includes(extension as `.${string}`);

		return isAcceptedType && file.size <= maxSizeMB * 1024 * 1024;
	};

	const handleMultipleFiles = (fileList: FileList | null) => {
		const files = Array.from(fileList ?? []);
		const validFiles = files.filter(isFileAccepted);
		const ignoredCount = files.length - validFiles.length;

		setError(
			ignoredCount > 0
				? `${ignoredCount} ${ignoredCount === 1 ? "arquivo ignorado" : "arquivos ignorados"}: tipo não permitido ou grande demais.`
				: null
		);

		if (validFiles.length === 0) return;

		setCurrentFile(
			validFiles.length === 1 && validFiles[0]
				? {
						name: validFiles[0].name,
						size: fileSizeInMB(validFiles[0].size),
					}
				: {
						name: `${validFiles.length} arquivos selecionados`,
						size: fileSizeInMB(
							validFiles.reduce((total, file) => total + file.size, 0)
						),
					}
		);
		onFilesSelected?.(validFiles);
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (multiple) {
			handleMultipleFiles(event.target.files);
			event.target.value = "";
			return;
		}

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

		if (multiple) {
			handleMultipleFiles(event.dataTransfer.files);
			return;
		}

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

	const acceptString = [...acceptedTypes, ...acceptedExtensions].join(",");
	const acceptedLabel = [
		...acceptedTypes.map((type) => type.split("/")[1]),
		...acceptedExtensions.map((extension) => extension.slice(1)),
	].join(", ");

	return (
		<div
			className={`flex flex-col w-full items-center justify-center gap-2 ${className}`}
		>
			{/* Main Upload Box */}
			<div
				className={`flex flex-col justify-center items-center bg-white border text-gray-500 gap-4 py-6 px-5 w-full transition-colors rounded-lg cursor-pointer ${
					isDragging
						? "border-primary-500 bg-primary-50"
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
						{acceptedLabel} (max. {maxSizeMB}MB)
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
				multiple={multiple}
				onChange={handleFileChange}
			/>
		</div>
	);
};

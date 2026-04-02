import { isPngImage } from "@/utils/validation";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import type { DragEvent } from "react";
import { useRef, useState, type ChangeEvent } from "react";

// Image upload component
interface ImageUploadAreaProps {
	onFileSelect: (file: File | null) => void;
	onDelete?: () => void;
	isUploading: boolean;
	currentImage?: string | null;
	title: string;
	description: string;
	aspectRatio?: string;
}

export const ImageUploadArea = ({
	onFileSelect,
	onDelete,
	isUploading,
	currentImage,
	title,
	description,
	aspectRatio = "aspect-square",
}: ImageUploadAreaProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [imageLoaded, setImageLoaded] = useState(false);
	const [isDragging, setIsDragging] = useState(false);

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			onFileSelect(file);
			setImageLoaded(false);
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
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

		if (file) {
			onFileSelect(file);
		} else {
			onFileSelect(null);
		}
	};

	return (
		<div className="space-y-3">
			<div className="text-center">
				<h3 className="text-sm font-medium text-gray-900">{title}</h3>
				<p className="text-xs text-gray-500">{description}</p>
			</div>

			<div
				className={`relative ${aspectRatio} w-full border-2 border-dashed border-gray-200 rounded-lg transition-colors`}
			>
				<div
					className={`rounded-lg ${aspectRatio} ${
						isDragging
							? "border border-primary-500 bg-primary-50"
							: "border border-gray-200 hover:border-gray-300"
					}`}
					onClick={triggerFileInput}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
				>
					{currentImage ? (
						<div className="relative w-full h-full">
							{/* Image Loaded  */}
							{!imageLoaded && (
								<div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
									<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
								</div>
							)}

							<img
								src={currentImage}
								alt={title}
								onLoad={() => {
									setImageLoaded(true);
								}}
								className={`w-full h-full object-contain border border-black-200 ${isPngImage(currentImage) ? "bg-white" : "bg-black"} 
								rounded-lg transition-opacity duration-300 ${
									imageLoaded ? "opacity-100" : "opacity-0"
								}`}
							/>

							<div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
								<div className="flex gap-2">
									<label
										htmlFor={`upload-${title.toLowerCase().replace(" ", "-")}`}
										className="cursor-pointer bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-colors"
									>
										<Camera className="h-5 w-5 text-gray-700" />
									</label>

									{onDelete && (
										<button
											type="button"
											onClick={onDelete}
											className="bg-white/90 rounded-full p-2 hover:bg-white transition-colors"
										>
											<Trash2 className="h-5 w-5 text-gray-700" />
										</button>
									)}
								</div>
							</div>
						</div>
					) : (
						<label
							htmlFor={`upload-${title.toLowerCase().replace(" ", "-")}`}
							className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-500 transition-colors"
						>
							{isUploading ? (
								<Loader2 className="h-8 w-8 animate-spin" />
							) : (
								<>
									<Upload className="h-8 w-8 mb-2" />
									<span className="text-xs">Clique para adicionar</span>
								</>
							)}
						</label>
					)}
				</div>
			</div>

			<input
				id={`upload-${title.toLowerCase().replace(" ", "-")}`}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
				disabled={isUploading}
			/>
		</div>
	);
};

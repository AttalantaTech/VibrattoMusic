import { Camera, Loader2, Trash2, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

// Image upload component
interface ImageUploadAreaProps {
	onFileSelect: (file: File) => void;
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
	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			onFileSelect(file);
		}
	};

	return (
		<div className="space-y-3">
			<div className="text-center">
				<h3 className="text-sm font-medium text-gray-900">{title}</h3>
				<p className="text-xs text-gray-500">{description}</p>
			</div>

			<div
				className={`relative ${aspectRatio} w-full border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors`}
			>
				{currentImage ? (
					<div className="relative w-full h-full">
						<img
							src={currentImage}
							alt={title}
							className="w-full h-full object-cover rounded-lg"
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

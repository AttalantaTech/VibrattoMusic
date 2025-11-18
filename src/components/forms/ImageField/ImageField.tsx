import { ImageIcon, Trash } from "lucide-react";
import { useState, useRef, type ChangeEvent } from "react";
import type { FileInfo } from "../../../common/types";
import { fileSizeInMB } from "../../../common/utils";

interface ImageFieldProps {
	onImageSelect?: (file: File) => void;
	initialImage?: string;
	className?: string;
	label: string;
}

export default function ImageField({
	onImageSelect,
	initialImage,
	className,
	label,
}: ImageFieldProps) {
	const [selectedImage, setSelectedImage] = useState<string | null>(
		initialImage || null
	);
	const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const file = event.target.files[0];

			const imageUrl = URL.createObjectURL(file);
			setSelectedImage(imageUrl);

			const sizeInMB = fileSizeInMB(file.size);
			setFileInfo({
				name: file.name,
				size: sizeInMB,
			});

			if (onImageSelect) {
				onImageSelect(file);
			}
		}
	};

	const handlerRemoveImage = () => {
		setFileInfo(null);
		setSelectedImage(null);
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

	return (
		<div className={"flex flex-col gap-3 " + className}>
			<span className="text-gray-700 font-medium text-sm">{label}</span>
			<div className="flex w-full border border-gray-500 rounded-lg bg-white gap-3 justify-between px-4 py-6 cursor-pointer items-center">
				<div className="flex w-full gap-4" onClick={triggerFileInput}>
					{selectedImage ? (
						<img
							alt="Preview"
							className="w-10 h-10 object-cover rounded-lg"
							src={selectedImage}
						/>
					) : (
						<ImageIcon size={28} />
					)}

					{fileInfo ? (
						<div className="text-sm">
							<p className="text-gray-700 font-medium">{fileInfo.name}</p>
							<p className="text-gray-500">{fileInfo.size}</p>
						</div>
					) : (
						<div className="text-sm">
							<p className="text-gray-700 font-medium">
								Clique para enviar uma imagem
							</p>
						</div>
					)}

					<input
						ref={fileInputRef}
						accept="image/*"
						className="hidden"
						type="file"
						onChange={handleImageChange}
					/>
				</div>
				<button onClick={handlerRemoveImage}>
					<Trash size={28} />
				</button>
			</div>
		</div>
	);
}

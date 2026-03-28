import { CloudUpload, GripVertical, Trash } from "lucide-react";
import {
	useState,
	useRef,
	useEffect,
	type ChangeEvent,
	type DragEvent,
} from "react";
import type { FileInfo } from "../../../common/types";
import { fileSizeInMB } from "../../../common/utils";
import { generateVideoThumbnail } from "../../../lib/utils/cn";

interface MidiaInfo extends FileInfo {
	file: File;
	preview: string;
	type?: string;
}

export type { MidiaInfo };

interface MultipleMidiaInputProps {
	value?: Array<MidiaInfo>;
	onChange?: (files: Array<MidiaInfo>) => void;
	acceptedTypes?: string;
	maxSizeMB?: number;
}

export const MultipleMidiaInput = ({
	value = [],
	onChange,
	acceptedTypes = "image/*, video/mp4",
	maxSizeMB = 10,
}: MultipleMidiaInputProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [files, setFiles] = useState<Array<MidiaInfo>>(value);
	const [isDragging, setIsDragging] = useState(false);
	const [draggedItem, setDraggedItem] = useState<number | null>(null);
	// Update internal state when value prop changes
	useEffect(() => {
		setFiles(value);
	}, [value]);

	// Helper to update both internal state and parent
	const updateFiles = (newFiles: Array<MidiaInfo>) => {
		setFiles(newFiles);
		onChange?.(newFiles);
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};
	const addNewFiles = async (eventFiles: Array<File>) => {
		// Filter files by size and validation
		const validFiles = eventFiles.filter((file) => {
			const fileSizeMB = file.size / (1024 * 1024);
			return fileSizeMB <= maxSizeMB;
		});

		const newFiles = await Promise.all(
			validFiles.map(async (file) => {
				const isVideo = file.type.startsWith("video/");
				let preview = URL.createObjectURL(file);

				if (isVideo) {
					preview = await generateVideoThumbnail(file);
				}

				return {
					name: file.name,
					size: fileSizeInMB(file.size),
					type: file.type.split("/")[0],
					file,
					preview,
				};
			})
		);

		updateFiles([...files, ...newFiles]);
	};

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const { files: eventFiles } = event.target;
		if (eventFiles && eventFiles.length > 0) {
			await addNewFiles(Array.from(eventFiles));
		}
	};

	const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const { files: eventFiles } = event.dataTransfer;
		if (eventFiles && eventFiles.length > 0) {
			await addNewFiles(Array.from(eventFiles));
		}
	};
	const removeFile = (index: number) => {
		const newFiles = [...files];
		URL.revokeObjectURL(newFiles[index]?.preview as string);
		newFiles.splice(index, 1);
		updateFiles(newFiles);
	};

	const handleDragStart = (index: number) => {
		setDraggedItem(index);
	};

	const handleDragOverItem = (
		index: number,
		event: React.DragEvent<HTMLDivElement>
	) => {
		event.preventDefault();
		if (draggedItem === null) return;
		if (draggedItem !== index) {
			const newFiles = [...files];
			const draggedFile = newFiles[draggedItem];
			newFiles.splice(draggedItem, 1);
			newFiles.splice(index, 0, draggedFile as MidiaInfo);
			updateFiles(newFiles);
			setDraggedItem(index);
		}
	};

	const handleDragEnd = () => {
		setDraggedItem(null);
	};

	return (
		<div className="flex flex-col w-full items-center justify-center gap-3">
			{/* Main Box */}
			<div
				className={`flex flex-col justify-center items-center bg-white border text-gray-500 gap-4 py-6 px-5 w-full transition-colors ${isDragging ? "border-primary-500 bg-primary-50" : "border-gray-200"}`}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				<div className="bg-gray-100 h-12 w-12 flex items-center justify-center">
					<CloudUpload size={30} />
				</div>
				<div className="flex flex-col gap-1 w-full items-center ">
					{" "}
					<p>
						<button
							className="font-semibold text-[#085ec5] cursor-pointer bg-transparent border-none underline"
							type="button"
							onClick={triggerFileInput}
						>
							Clique aqui
						</button>{" "}
						ou arraste e solte
					</p>
					<p>SVG, PNG, JPG, GIF, MP4 (max. 800x400px)</p>
				</div>
			</div>
			{/* Files list */}{" "}
			<div className="flex flex-col gap-3 w-full">
				{files.map((file, index) => (
					<div
						key={`${file.name}-${file.size}-${index}`}
						draggable
						className={`flex w-full items-center justify-around border border-gray-200 rounded-lg bg-white gap-3 px-4 py-6 ${draggedItem === index ? "opacity-50" : ""}`}
						onDragEnd={handleDragEnd}
						onDragOver={(event) => {
							handleDragOverItem(index, event);
						}}
						onDragStart={() => {
							handleDragStart(index);
						}}
					>
						<div className="flex w-full gap-4 items-center">
							<div
								draggable
								className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
								onDragStart={(event) => {
									event.stopPropagation();
									handleDragStart(index);
								}}
							>
								<GripVertical size={20} />
							</div>
							<img
								alt="preview"
								className="w-10 h-10 object-cover rounded-lg"
								src={file.preview}
							/>
							<div className="text-sm">
								<p className="text-gray-700 font-medium">{file.name}</p>
								<p className="text-gray-500">{file.size}</p>
							</div>
						</div>
						<button
							onClick={() => {
								removeFile(index);
							}}
						>
							<Trash size={28} />
						</button>
					</div>
				))}
			</div>{" "}
			<input
				ref={fileInputRef}
				multiple
				accept={acceptedTypes}
				className="hidden"
				type="file"
				onChange={handleFileChange}
			/>
		</div>
	);
};

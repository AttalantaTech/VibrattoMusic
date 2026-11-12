import { FileUploadBox } from "@/components/forms/FileUploadBox/FileUploadBox";
import { SectionHeader } from "./shared/SectionHeader";
import { Loader2, X } from "lucide-react";
import {
	isMP4File,
	isPngImage,
	videoThumbnailSource,
} from "@/utils/validation";
import { TextAreaField } from "@/components/forms/TextAreaField/TextAreaField";
import type { FilePropsLocal } from "@/api/types";
import { UploadingTile } from "./shared/UploadingTile";
import { SortableFile, SortableFiles } from "./shared/SortableFiles";
import type { FileUpload } from "../utils/uploadProgress";

type CarouselSectionProps = {
	carousel: Array<FilePropsLocal>;
	loadingMap: Record<string, boolean>;
	markAsLoaded: (url: string) => void;
	/** Files being sent, shown after the ones already added */
	uploads?: Array<FileUpload>;
	/** The files in the order they were dragged into, to be saved */
	onReorder?: (ordered: Array<FilePropsLocal>) => void;
	onUpload: (files: Array<File>) => Promise<void>;
	onRemove: (id: number | null, index: number) => Promise<void>;
	onLegendCarousel: (file: FilePropsLocal, legend: string) => void;
};

export function CarouselSection({
	carousel,
	loadingMap,
	uploads = [],
	onReorder,
	onUpload,
	onRemove,
	markAsLoaded,
	onLegendCarousel,
}: CarouselSectionProps) {
	return (
		<div className="bg-gray-50 py-6 border-b">
			<SectionHeader
				title="Carrossel de Imagens/Vídeos"
				subtitle={`A primeira imagem é definida como principal por padrão. Você
				pode alterar a ordem arrastando cada arquivo pelo ícone no canto`}
			/>

			<FileUploadBox
				acceptedTypes={["image/jpg", "image/jpeg", "image/png", "video/mp4"]}
				maxSizeMB={100}
				multiple
				onFilesSelected={(files) => {
					void onUpload(files);
				}}
			/>

			<SortableFiles files={carousel} onReorder={onReorder}>
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 my-4">
					{carousel.map((file, index) => (
						<SortableFile
							key={file.link}
							link={file.link}
							label={`Mover imagem ${index + 1}`}
							canMove={Boolean(onReorder) && carousel.length > 1}
						>
							<div className="relative aspect-square rounded-lg overflow-hidden border border-white-200 bg-white">
								<div className="relative w-full h-full">
									{!loadingMap[file.link] && (
										<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
											<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
										</div>
									)}

									{isMP4File(file.link) ? (
										<div className="w-full">
											<video
												preload="metadata"
												className="w-full h-full aspect-square"
												onLoadedMetadata={() => {
													markAsLoaded(file.link);
												}}
											>
												<source
													src={videoThumbnailSource(file.link)}
													type="video/mp4"
												/>
											</video>
										</div>
									) : (
										<img
											src={file.link}
											alt={`Imagem ${index + 1}`}
											onLoad={() => {
												markAsLoaded(file.link);
											}}
											className={`w-full h-full object-contain border border-gray-200 
															${isPngImage(file.link) ? "bg-white" : "bg-black"}  transition-opacity duration-300 ${
																loadingMap[file.link]
																	? "opacity-100"
																	: "opacity-0"
															}`}
										/>
									)}
								</div>

								<button
									type="button"
									onClick={() => onRemove(file.id, index)}
									className="absolute top-1 right-1 rounded-full bg-gray-200"
								>
									<X size={14} />
								</button>
							</div>

							<TextAreaField
								placeholder="Adicione uma legenda ao seu arquivo"
								name="Legenda"
								rows={3}
								showCharCount
								maxLength={100}
								className="w-full"
								value={file.legenda || ""}
								onChange={(event) => {
									onLegendCarousel(file, event.target.value);
								}}
							/>
						</SortableFile>
					))}
					{uploads.map((upload) => (
						<UploadingTile key={upload.id} upload={upload} />
					))}
				</div>
			</SortableFiles>
		</div>
	);
}

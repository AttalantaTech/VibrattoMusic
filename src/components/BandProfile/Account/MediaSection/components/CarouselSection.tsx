import { FileUploadBox } from "@/components/forms/FileUploadBox/FileUploadBox";
import { SectionHeader } from "./shared/SectionHeader";
import { Loader2, X } from "lucide-react";
import { isMP4File, isPngImage } from "@/utils/validation";
import { TextAreaField } from "@/components/forms/TextAreaField/TextAreaField";
import type { FilePropsLocal } from "@/api/types";

type CarouselSectionProps = {
	carousel: Array<FilePropsLocal>;
	loadingMap: Record<string, boolean>;
	markAsLoaded: (url: string) => void;
	onUpload: (file: File | null) => Promise<void>;
	onRemove: (id: number | null, index: number) => Promise<void>;
	onLegendCarousel: (file: FilePropsLocal, legend: string) => void;
};

export function CarouselSection({
	carousel,
	loadingMap,
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
				pode alterar a ordem das imagens arrastando-as até a posição desejada`}
			/>

			<FileUploadBox
				acceptedTypes={["image/jpg", "image/jpeg", "image/png", "video/mp4"]}
				maxSizeMB={100}
				onFileSelected={onUpload}
			/>

			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 my-4">
				{carousel.map((file, index) => (
					<div key={file.link} className="px-1">
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
											className="w-full h-full aspect-square"
											onLoadedMetadata={() => {
												markAsLoaded(file.link);
											}}
										>
											<source src={file.link} type="video/mp4" />
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
							maxLength={250}
							className="w-full"
							value={file.legenda || ""}
							onChange={(event) => {
								onLegendCarousel(file, event.target.value);
							}}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

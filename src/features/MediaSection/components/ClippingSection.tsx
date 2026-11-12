import { FileUploadBox } from "@/components/forms/FileUploadBox/FileUploadBox";
import { X, Loader2, HelpCircle } from "lucide-react";
import { SectionHeader } from "./shared/SectionHeader";
import { TooltipCustom } from "@/components/ui/TooltipCustom/TooltipCustom";
import {
	isEpsFile,
	isMP4File,
	isPdfFile,
	isPngImage,
	videoThumbnailSource,
} from "@/utils/validation";
import type { FilePropsLocal } from "@/api/types";
import { UploadingTile } from "./shared/UploadingTile";
import { SortableFile, SortableFiles } from "./shared/SortableFiles";
import type { FileUpload } from "../utils/uploadProgress";
import { TextAreaField } from "@/components/forms/TextAreaField/TextAreaField";
import { EpsFilePreview } from "@/components/cards/EpsFilePreview/EpsFilePreview";
import { PdfViewer } from "@/components/PdfViewer/PdfViewer";

type ClippingSectionProps = {
	clipping: Array<FilePropsLocal>;
	loadingMap: Record<string, boolean>;
	markAsLoaded: (url: string) => void;
	/** Files being sent, shown after the ones already added */
	uploads?: Array<FileUpload>;
	/** The files in the order they were dragged into, to be saved */
	onReorder?: (ordered: Array<FilePropsLocal>) => void;
	onUpload: (files: Array<File>) => Promise<void>;
	onRemove: (id: number | null, index: number) => Promise<void>;
	onLegendClipping: (file: FilePropsLocal, legend: string) => void;
};

export function ClippingSection({
	clipping,
	loadingMap,
	uploads = [],
	onReorder,
	onUpload,
	onRemove,
	markAsLoaded,
	onLegendClipping,
}: ClippingSectionProps) {
	return (
		<div className="bg-gray-50 py-6 border-b">
			<SectionHeader
				title="Upload de Materiais de Divulgação"
				subtitle="Você pode alterar a ordem arrastando cada arquivo pelo ícone no canto"
				tooltip={
					<TooltipCustom
						trigger={<HelpCircle className="w-4 h-4 cursor-pointer" />}
						content="Faça upload de materiais de divulgação, como PDFs de artigos,
                         reportagens, críticas, logos e artes em EPS ou qualquer outra publicação
                          que destaque sua banda. Isso ajuda a construir sua reputação e a mostrar
                          seu impacto na mídia."
					/>
				}
			/>

			<FileUploadBox
				className="mb-2"
				acceptedTypes={[
					"image/jpg",
					"image/jpeg",
					"image/png",
					"application/pdf",
					"video/mp4",
				]}
				acceptedExtensions={[".eps"]}
				maxSizeMB={100}
				multiple
				onFilesSelected={(files) => {
					void onUpload(files);
				}}
			/>

			<SortableFiles files={clipping} onReorder={onReorder}>
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
					{clipping.map((file, index) => (
						<SortableFile
							key={file.link}
							link={file.link}
							label={`Mover arquivo ${index + 1}`}
							canMove={Boolean(onReorder) && clipping.length > 1}
						>
							<div className="relative aspect-square rounded-lg overflow-hidden border border-white-200 bg-white">
								{!loadingMap[file.link] && !isEpsFile(file.link) && (
									<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
										<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
									</div>
								)}

								{isEpsFile(file.link) ? (
									<EpsFilePreview link={file.link} showDownload />
								) : isPdfFile(file.link) ? (
									<PdfViewer
										preview
										title={`Arquivo PDF ${index + 1}`}
										src={`${file.link}#toolbar=0`}
										onLoad={() => {
											markAsLoaded(file.link);
										}}
										className={`w-full h-full transition-opacity duration-300 ${
											loadingMap[file.link] ? "opacity-100" : "opacity-0"
										}`}
									/>
								) : isMP4File(file.link) ? (
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
										className={`w-full h-full object-contain transition-opacity duration-300 
																		${isPngImage(file.link) ? "bg-white" : "bg-black"} ${
																			loadingMap[file.link]
																				? "opacity-100"
																				: "opacity-0"
																		}`}
									/>
								)}

								<button
									type="button"
									onClick={() => onRemove(file.id, index)}
									className="absolute top-1 right-1 bg-gray-200 hover:bg-gray-300  text-gray-800 rounded-full p-1 transition-colors"
								>
									<X className="w-3 h-3" />
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
									onLegendClipping(file, event.target.value);
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

import { FileUploadBox } from "@/components/forms/FileUploadBox/FileUploadBox";
import { X, Loader2, HelpCircle } from "lucide-react";
import { SectionHeader } from "./shared/SectionHeader";
import { TooltipCustom } from "@/components/ui/TooltipCustom/TooltipCustom";
import {
	isEpsFile,
	isMP4File,
	isPdfFile,
	isPngImage,
} from "@/utils/validation";
import type { FilePropsLocal } from "@/api/types";
import { TextAreaField } from "@/components/forms/TextAreaField/TextAreaField";
import { EpsFilePreview } from "@/components/cards/EpsFilePreview/EpsFilePreview";

type ClippingSectionProps = {
	clipping: Array<FilePropsLocal>;
	loadingMap: Record<string, boolean>;
	markAsLoaded: (url: string) => void;
	onUpload: (file: File | null) => Promise<void>;
	onRemove: (id: number | null, index: number) => Promise<void>;
	onLegendClipping: (file: FilePropsLocal, legend: string) => void;
};

export function ClippingSection({
	clipping,
	loadingMap,
	onUpload,
	onRemove,
	markAsLoaded,
	onLegendClipping,
}: ClippingSectionProps) {
	return (
		<div className="bg-gray-50 py-6 border-b">
			<SectionHeader
				title="Upload de Materiais de Divulgação"
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
				onFileSelected={onUpload}
			/>

			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
				{clipping.map((file, index) => (
					<div key={file.link} className="px-1">
						<div className="relative aspect-square rounded-lg overflow-hidden border border-white-200 bg-white">
							{!loadingMap[file.link] && !isEpsFile(file.link) && (
								<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
									<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
								</div>
							)}

							{isEpsFile(file.link) ? (
								<EpsFilePreview link={file.link} showDownload />
							) : isPdfFile(file.link) ? (
								<div className="w-full">
									<embed
										src={`${file.link}#toolbar=0`}
										onLoad={() => {
											markAsLoaded(file.link);
										}}
										className={`w-full h-full object-contain transition-opacity duration-300 ${
											loadingMap[file.link] ? "opacity-100" : "opacity-0"
										}`}
									/>
								</div>
							) : isMP4File(file.link) ? (
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
					</div>
				))}
			</div>
		</div>
	);
}

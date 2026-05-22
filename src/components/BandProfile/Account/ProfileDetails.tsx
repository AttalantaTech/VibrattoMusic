import type { FileProps } from "@/api/types";
import type { MusicalProduct } from "@/components/BandProfileSwitcher";
import { StageMapArea } from "@/components/StageMap/StageMapArea";
import { CarouselItem } from "@/components/ui/carousel";
import { Carousel } from "@/components/ui/Carousel/Carousel";
import { LazyImage } from "@/components/ui/LazyImage/LazyImage";
import { TabNavigation } from "@/components/ui/TabNavigation/TabNavigation";
import { ViewFileModal } from "@/components/ViewFileModal/ViewFileModal";
import { useInstrumentos } from "@/hooks/useFilters";
import { isMP4File, isPdfFile, isPngImage } from "@/utils/validation";
import { Disc, Loader2, MapPin, Verified } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

interface ProfileDetailsProps {
	musicalProduct: MusicalProduct;
}

// Secondary tabs for gallery
const secondaryTabs = [
	{ label: "Materiais de Divulgação", value: "clipping" },
	{ label: "Mapa de Palco", value: "stageMap" },
	{ label: "Rider Técnico", value: "technicalRider" },
	{ label: "Camarim", value: "dressingRoom" },
];

const styles = {
	genre: "font-medium text-[#085EC5] bg-[#D6F2FF] py-[2x] px-2 rounded-2xl",
	subtitle: "text-gray-500 text-xs flex w-full items-start justify-start",
	artistInfoBox:
		"flex flex-col w-full h-full items-center justify-center gap-[6px]",
	section: "flex flex-col w-full gap-[6px] items-start justify-start",
};

export const ProfileDetails = ({ musicalProduct }: ProfileDetailsProps) => {
	const { data: instrumentsData } = useInstrumentos();

	const [activeTab, setActiveTab] = useState("clipping");
	const [viewFile, setViewFile] = useState<{
		isOpen: boolean;
		file: FileProps | null;
	}>({ isOpen: false, file: null });
	const [loadedFiles, setLoadedFiles] = useState<Record<string, boolean>>({});

	const handleFileLoad = (link: string) => {
		setLoadedFiles((previous) => ({
			...previous,
			[link]: true,
		}));
	};

	const renderTabContent = (): ReactNode => {
		switch (activeTab) {
			case "clipping":
				if (musicalProduct?.clipagem.length === 0) {
					return (
						<div className="flex items-center justify-center w-full min-h-[380px] bg-gray-100">
							<span className="block text-center text-sm text-gray-600">
								Nenhum arquivo foi adicionado
							</span>
						</div>
					);
				} else {
					return (
						<>
							{musicalProduct && musicalProduct?.clipagem.length > 0 && (
								<Carousel>
									{musicalProduct.clipagem.map((file, index) => (
										<CarouselItem
											key={index}
											className=" basis-full md:basis-1/2 lg:basis-1/3 cursor-pointer"
											onClick={() => {
												setViewFile({
													isOpen: true,
													file,
												});
											}}
										>
											<div
												key={index}
												className="relative aspect-square rounded-lg overflow-hidden border border-white-200 bg-white"
											>
												<div className="relative w-full h-full">
													{!loadedFiles[file.link] && (
														<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
															<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
														</div>
													)}

													{isPdfFile(file.link) ? (
														<div className="relative group">
															<iframe
																key={file.id || index}
																className="rounded-lg w-full h-48 sm:h-64 lg:h-[280px] pointer-events-none"
																src={`${file.link}#toolbar=0`}
															/>

															<div className="absolute inset-0 z-10 cursor-pointer bg-transparent hover:bg-gray-900/10 transition-colors rounded-lg" />
														</div>
													) : isMP4File(file.link) ? (
														<div className="relative group rounded-lg w-full h-48 sm:h-64 lg:h-[280px] object-contain border border-gray-200">
															<video
																className="w-full h-full aspect-square"
																onLoadedMetadata={() => {
																	handleFileLoad(file.link);
																}}
															>
																<source src={file.link} type="video/mp4" />
															</video>

															<div className="absolute inset-0 z-10 cursor-pointer bg-transparent hover:bg-gray-900/10 transition-colors rounded-lg" />
														</div>
													) : (
														<div className="relative group">
															<LazyImage
																key={file.id || index}
																alt="Band clipping photo"
																className={`rounded-lg w-full h-48 sm:h-64 lg:h-[280px] object-contain border border-gray-200
                                  ${isPngImage(file.link) ? "bg-white" : "bg-black"}`}
																src={file.link}
															/>

															<div className="absolute inset-0 z-10 cursor-pointer bg-transparent hover:bg-gray-900/20 transition-colors rounded-lg" />
														</div>
													)}
												</div>
											</div>
										</CarouselItem>
									))}
								</Carousel>
							)}
						</>
					);
				}
			case "stageMap":
				if (musicalProduct && musicalProduct?.mapaPalco.length > 0) {
					return (
						<StageMapArea
							stageMapList={musicalProduct.mapaPalco}
							instrumentsData={instrumentsData}
						/>
					);
				} else if (musicalProduct?.mapaPalcoLink) {
					return (
						<div className="flex w-full min-h-[680px]">
							<embed className="w-full" src={musicalProduct.mapaPalcoLink} />
						</div>
					);
				} else {
					return (
						<div className="flex items-center justify-center w-full min-h-[380px] bg-gray-100">
							<span className="block text-center text-sm text-gray-600">
								Nenhum mapa de palco foi adicionado
							</span>
						</div>
					);
				}
			case "technicalRider":
				if (musicalProduct?.rider) {
					return (
						<div className="flex w-full min-h-[680px]">
							<embed className="w-full" src={musicalProduct.rider} />
						</div>
					);
				} else if (musicalProduct?.riderTexto) {
					return (
						<div className="flex justify-center items-center p-4 max-w-screen-md min-h-[480px] bg-gray-100 w-full">
							<div
								dangerouslySetInnerHTML={{ __html: musicalProduct.riderTexto }}
							/>
						</div>
					);
				} else {
					return (
						<div className="flex items-center justify-center w-full min-h-[380px] bg-gray-100">
							<span className="block text-center text-sm text-gray-600">
								Nenhum texto ou arquivo de rider técnico foi adicionado
							</span>
						</div>
					);
				}
			default:
				if (musicalProduct?.infraCamarim) {
					return (
						<div className="flex w-full min-h-[680px]">
							<embed className="w-full" src={musicalProduct.infraCamarim} />
						</div>
					);
				} else if (musicalProduct?.infraCamarimTexto) {
					return (
						<div className="flex justify-center items-center p-4 max-w-screen-md min-h-[480px] bg-gray-100 w-full">
							<div
								dangerouslySetInnerHTML={{
									__html: musicalProduct.infraCamarimTexto,
								}}
							/>
						</div>
					);
				} else {
					return (
						<div className="flex items-center justify-center w-full min-h-[380px] bg-gray-100">
							<span className="block text-center text-sm text-gray-600">
								Nenhum texto ou arquivo de infraestrutura de camarim foi
								adicionado
							</span>
						</div>
					);
				}
		}
	};

	return (
		<>
			{/* Picture and info */}
			<section className="flex flex-col lg:flex-row pt-0 lg:pt-6 w-full items-center lg:items-start justify-start gap-4 lg:gap-6">
				<LazyImage
					alt="Band cover"
					className={`rounded-lg w-40 h-40 lg:w-72 sm:h-48 lg:h-52 object-contain border border-gray-200
									${isPngImage(musicalProduct.fotoPerfil ?? "") ? "bg-white" : "bg-black"}`}
					src={musicalProduct.fotoPerfil}
				/>
				<div className="flex flex-col w-full h-full items-center lg:items-start justify-center gap-4">
					{/* Basic info */}
					<div className={`${styles.artistInfoBox} lg:items-start`}>
						<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full">
							<div className="flex flex-col items-center sm:items-start gap-2 w-full">
								<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
									{musicalProduct.categoria.nome ?? ""}
								</h2>
								<div className="flex items-center gap-3">
									<h1 className="text-gray-900 font-bold text-xl sm:text-2xl">
										{musicalProduct.nome}
									</h1>
									<Verified color="#3E97FF" size={24} />
								</div>

								{/* Genres */}
								<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
									{musicalProduct.generoMusical?.map((genero) => (
										<span
											key={genero.id}
											className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
										>
											{genero.nome}
										</span>
									)) || (
										<>
											<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
												Forró
											</span>
											<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
												Sertanejo
											</span>
										</>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Location */}
					<div className={`${styles.artistInfoBox} lg:items-start`}>
						<div className="flex flex-col items-center sm:items-start gap-3 w-full">
							<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
								Localização
							</h2>
							<div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full">
								<div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
									<MapPin size={18} className="text-gray-600" />
									<span className="text-gray-900 font-semibold">
										{musicalProduct.cidade?.nome || "Localização não informada"}
									</span>
								</div>
								{musicalProduct.podeDeslocamento && (
									<span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
										Itinerante
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Social Media */}
					{musicalProduct.redeSocial &&
						musicalProduct.redeSocial.length > 0 && (
							<div className={`${styles.artistInfoBox} lg:items-start`}>
								<div className="flex flex-col items-center sm:items-start gap-3 w-full">
									<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
										Redes Sociais
									</h2>
									<div className="flex flex-wrap gap-3 justify-center sm:justify-start">
										{musicalProduct.redeSocial.map((social, index) => (
											<a
												key={social.idRedeSocial || index}
												href={social.link}
												target="_blank"
												rel="noopener noreferrer"
												className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
											>
												{social.nomeRedeSocial || "Rede Social"}
											</a>
										))}
									</div>
								</div>
							</div>
						)}
				</div>
			</section>

			{/* Event Types */}
			{musicalProduct.tipoEvento && musicalProduct.tipoEvento.length > 0 && (
				<section className={styles.section}>
					<div className="flex flex-col items-center lg:items-start gap-4 w-full">
						<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
							Tipos de Eventos
						</h2>
						<div className="flex flex-wrap w-full items-center justify-center lg:justify-start gap-3">
							{musicalProduct.tipoEvento.map((tipo, index) => (
								<div
									key={tipo.id || index}
									className="flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 font-medium"
								>
									<Disc size={18} />
									<span>{tipo.nome}</span>
								</div>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Band Description */}
			{musicalProduct.descricao && (
				<section className={styles.section}>
					<h2 className={styles.subtitle}>BIO</h2>
					<p className="text-sm lg:text-lg text-gray-800 text-justify">
						{musicalProduct.descricao}
					</p>
				</section>
			)}

			{/* Gallery */}
			<section className={styles.section}>
				<div className="w-full flex items-center justify-center">
					{musicalProduct && musicalProduct?.imagens.length > 0 && (
						<Carousel>
							{musicalProduct.imagens.map((image, index) => (
								<CarouselItem
									key={index}
									className=" basis-full md:basis-1/2 lg:basis-1/3"
									onClick={() => {
										setViewFile({
											isOpen: true,
											file: image,
										});
									}}
								>
									<div className="relative group">
										<LazyImage
											key={image.id || index}
											alt="Band clipping photo"
											className={`rounded-lg w-full h-48 sm:h-64 lg:h-[280px] object-contain border border-gray-200
														${isPngImage(image.link) ? "bg-white" : "bg-black"}`}
											src={image.link}
										/>

										<div className="absolute inset-0 z-10 cursor-pointer bg-transparent hover:bg-gray-900/20 transition-colors rounded-lg" />
									</div>
								</CarouselItem>
							))}
						</Carousel>
					)}
				</div>
			</section>

			<section className={styles.section.replace("gap-[6px]", "gap-8")}>
				<TabNavigation
					currentTab={activeTab ?? "stageMap"}
					tabs={secondaryTabs}
					variant="underline"
					onChange={setActiveTab}
				/>

				<div className="flex flex-col lg:flex-row w-full items-start gap-4 lg:gap-8 justify-start lg:justify-center max-w-9xl overflow-auto">
					{renderTabContent()}
				</div>

				<hr className="w-full text-gray-200" />
			</section>

			<ViewFileModal
				isOpen={viewFile.isOpen}
				setViewFile={setViewFile}
				file={viewFile.file}
			/>
		</>
	);
};

import type { Dispatch, SetStateAction } from "react";
import { useState, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Loader2, MapIcon, HelpCircle, ChevronLeft } from "lucide-react";
import { imageUploadService } from "../../../../api";
import { Button } from "../../../ui/Button/Button";
import { IconTabNavigation } from "../../../ui/IconTabNavigation/IconTabNavigation";
import { FileUploadBox } from "../../../forms/FileUploadBox/FileUploadBox";
import { StageMapBuilder } from "@/components/StageMap/StageMapBuilder";

import type { StageElement, StageMapData } from "@/components/StageMap/types";
import { STAGE_COLORS } from "@/components/StageMap/types";
import { TooltipCustom } from "@/components/ui/TooltipCustom/TooltipCustom";
import { SimpleEditor } from "@/components/forms/SimpleEditor/SimpleEditor";
import { FileCard } from "@/components/cards/FileCard/FileCard";
import { ToggleSwitch } from "@/components/forms/ToggleSwitch/ToggleSwitch";
import type { FileEventType, FilterOptionInstrument } from "@/api/types";
import { useInstrumentos } from "@/hooks/useFilters";
import { toast } from "sonner";
import { AccountLayout } from "../../layout/AccountLayout/AccountLayout";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useUpdateMusicalProduct } from "@/hooks/useMusicalProducts";
import { ViewStageMapModal } from "@/components/ViewStageMapModal";
import { StageMapArea } from "@/components/StageMap/StageMapArea";

// Define styles consistent with modern interface pattern
const styles = {
	titleText: "text-gray-700 text-sm font-medium",
	sectionContainer: "bg-gray-50 py-4 sm:py-6 border-b-2 border-gray-200",
	sectionTitle: "flex items-center gap-2 mb-3 sm:mb-4",
	sectionIcon: "text-primary-600 flex-shrink-0",
};

// Helper function to convert saved StageMapData back to StageElement format
function convertStageMapDataToElements(
	stageMapData: Array<StageMapData>,
	instrumentsData: Array<FilterOptionInstrument>
): Array<StageElement> {
	return stageMapData
		.map((item, index) => {
			const instrument = instrumentsData.find(
				(inst) => inst.Id === item.idInstrumento
			);
			if (!instrument) {
				return null;
			}

			return {
				id: `saved-element-${item.idInstrumento}-${index}`,
				name: instrument.Nome,
				x: item.posicaoX,
				y: item.posicaoY,
				icon: instrument.Icone,
				category:
					instrument.IdTipoEquipamento === 1
						? ("instrument" as const)
						: ("infrastructure" as const),
				color:
					instrument.IdTipoEquipamento === 1
						? STAGE_COLORS.instrument
						: STAGE_COLORS.infrastructure,
				idTipoEquipamento: instrument.IdTipoEquipamento,
				instrumentId: item.idInstrumento,
				width: 80,
				height: 80,
			};
		})
		.filter(Boolean) as Array<StageElement>;
}

const technicalSchema = z.object({
	rider: z
		.string()
		.optional()
		.transform((value) => (value && value.trim() !== "" ? value : null))
		.nullable(),
	riderTexto: z
		.string()
		.optional()
		.transform((value) => (value && value.trim() !== "" ? value : null))
		.nullable(),
	infraCamarim: z
		.string()
		.optional()
		.transform((value) => (value && value.trim() !== "" ? value : null))
		.nullable(),
	camarimIncluso: z.boolean().default(false),
	infraCamarimTexto: z
		.string()
		.optional()
		.transform((value) => (value && value.trim() !== "" ? value : null))
		.nullable(),
	mapaPalco: z.array(
		z.object({
			idInstrumento: z.number(),
			posicaoX: z.number(),
			posicaoY: z.number(),
		})
	),
	mapaPalcoLink: z
		.string()
		.optional()
		.transform((value) => (value && value.trim() !== "" ? value : null))
		.nullable(),
});

const riderTabs = [
	{
		label: "Digitar Rider",
		value: "digital",
		icon: null,
	},
	{
		label: "Fazer upload de arquivo",
		value: "upload",
		icon: null,
	},
];

const camarimTabs = [
	{
		label: "Digitar Camarim",
		value: "digital",
		icon: null,
	},
	{
		label: "Fazer upload de arquivo",
		value: "upload",
		icon: null,
	},
];

const stageMapTabs = [
	{
		label: "Criar manualmente",
		value: "digital",
		icon: null,
	},
	{
		label: "Fazer upload de arquivo",
		value: "upload",
		icon: null,
	},
];

type TechnicalFormData = z.infer<typeof technicalSchema>;

interface TechnicalSectionProps {
	onActiveSection: Dispatch<SetStateAction<string>>;
}

export default function TechnicalSection({
	onActiveSection,
}: TechnicalSectionProps) {
	const { data: instrumentsData } = useInstrumentos();
	const { activeProduct } = useMusicalProductStore();

	const updateMusicalProductMutation = useUpdateMusicalProduct();

	// Step4 UI pattern state
	const [loading, setLoading] = useState(false);
	const [isStageBuilderOpen, setIsStageBuilderOpen] = useState(false);
	const [isOpenViewStageMap, setIsOpenViewStageMap] = useState(false);

	const [riderTab, setRiderTab] = useState("upload");
	const [riderFile, setRiderFile] = useState<File | null>(null);
	const [riderFileUrl, setRiderFileUrl] = useState<string | null>(null);

	const [hasDressingRoom, setHasDressingRoom] = useState(
		activeProduct?.camarimIncluso ?? false
	);
	const [dressingRoomTab, setDressingRoomTab] = useState("upload");
	const [dressingRoomFile, setDressingRoomFile] = useState<File | null>(null);
	const [dressingRoomFileUrl, setDressingRoomFileUrl] = useState<string | null>(
		null
	);

	const [stageMapTab, setStageMapTab] = useState("upload");
	const [stageMapFile, setStageMapFile] = useState<File | null>(null);
	const [stageMapUrl, setStageMapUrl] = useState<string | null>(null);

	// const [infraCamarim, setInfraCamarim] = useState("");
	const [stageMapData, setStageMapData] = useState<Array<StageMapData>>([]);

	// Get initial media data from onboarding context
	const initialTechinicalData: TechnicalFormData = useMemo(() => {
		return {
			rider: activeProduct?.rider ?? null,
			riderTexto: activeProduct?.riderTexto ?? null,
			infraCamarim: activeProduct?.infraCamarim ?? null,
			infraCamarimTexto: activeProduct?.infraCamarimTexto ?? null,
			camarimIncluso: activeProduct?.camarimIncluso ?? false,
			mapaPalco: activeProduct?.mapaPalco ?? [],
			mapaPalcoLink: activeProduct?.mapaPalcoLink ?? null,
		};
	}, [activeProduct]);

	// Convert saved stage map data to initial elements for the builder
	const initialStageElements = useMemo(() => {
		return convertStageMapDataToElements(stageMapData, instrumentsData ?? []);
	}, [stageMapData, instrumentsData]);

	const { handleSubmit, control, reset } = useForm<TechnicalFormData>({
		resolver: zodResolver(technicalSchema),
		defaultValues: { ...initialTechinicalData },
	});

	// Sync default values with Step4 state
	useEffect(() => {
		reset({ ...initialTechinicalData });
		setHasDressingRoom(initialTechinicalData.camarimIncluso);
		setRiderFileUrl(initialTechinicalData.rider);
		setDressingRoomFileUrl(initialTechinicalData.infraCamarim);
		setStageMapData(initialTechinicalData.mapaPalco || []);
		setRiderTab(initialTechinicalData.riderTexto ? "digital" : "upload");
		setDressingRoomTab(
			initialTechinicalData.infraCamarimTexto ? "digital" : "upload"
		);
		setStageMapUrl(initialTechinicalData.mapaPalcoLink);
		setStageMapTab(
			initialTechinicalData.mapaPalco?.length > 0 ? "digital" : "upload"
		);
	}, [reset, initialTechinicalData]);

	const handleRiderFileUpload = (file: File | null) => {
		setRiderFile(file);

		// Reset the uploaded URL when a new file is selected
		if (file) {
			setRiderFileUrl(null);
		}
	};

	const handleCamarimFileUpload = (file: File | null) => {
		setDressingRoomFile(file);

		// Reset the uploaded URL when a new file is selected
		if (file) {
			setDressingRoomFileUrl(null);
		}
	};

	const handleStageMapFileUpload = (file: File | null) => {
		setStageMapFile(file);

		// Reset the uploaded URL when a new file is selected
		if (file) {
			setStageMapUrl(null);
		}
	};

	const removeFile = async (eventType: FileEventType) => {
		try {
			// It only makes a request to remove an image from Azure if it exists there.
			if (
				(eventType === "ProdutoMusicalRider" && activeProduct?.rider) ||
				(eventType === "ProdutoMusicalInfraCamarim" &&
					activeProduct?.infraCamarim) ||
				(eventType === "ProdutoMusicalMapaPalco" &&
					activeProduct?.mapaPalcoLink)
			) {
				await imageUploadService.deleteImage({
					idCadastro: activeProduct.id,
					evento: eventType,
				});
			}

			if (eventType === "ProdutoMusicalRider") {
				setRiderFileUrl(null);
				setRiderFile(null);
			}

			if (eventType === "ProdutoMusicalInfraCamarim") {
				setDressingRoomFileUrl(null);
				setDressingRoomFile(null);
			}

			if (eventType === "ProdutoMusicalMapaPalco") {
				setStageMapUrl(null);
				setStageMapFile(null);
			}
		} catch (error) {
			console.error(error);
		}
	};

	const handleStageMapSave = (stageElements: Array<StageMapData>) => {
		setStageMapData(stageElements);
		setIsStageBuilderOpen(false);
	};

	const removeHtml = (text: string): string => {
		return text
			.replace(/<[^>]+>/g, "")
			.replace(/&nbsp;/g, " ")
			.trim();
	};

	const onSubmit = async (technicalData: TechnicalFormData) => {
		if (!activeProduct?.id) {
			console.error("ID do produto musical não encontrado");
			toast.error("Produto musical não encontrado");
			return;
		}

		setLoading(true);
		try {
			const uploadPromises = [];

			let finalRiderUrl = riderFileUrl || null;
			let finalDressingRoomUrl = dressingRoomFileUrl || null;
			let finalStageMapUrl = stageMapUrl || null;

			if (riderFile) {
				// Reset the uploaded URL if needed
				if (finalRiderUrl) {
					await imageUploadService.deleteImage({
						evento: "ProdutoMusicalRider",
						idCadastro: activeProduct.id,
					});
				}

				uploadPromises.push(
					imageUploadService
						.uploadImage({
							evento: "ProdutoMusicalRider",
							idCadastro: activeProduct.id,
							file: riderFile,
						})
						.then((url) => ({ type: "rider-promise", url }))
				);
			}

			if (dressingRoomFile) {
				// Handle file upload for Dressing Room if needed
				if (finalDressingRoomUrl) {
					await imageUploadService.deleteImage({
						evento: "ProdutoMusicalInfraCamarim",
						idCadastro: activeProduct.id,
					});
				}

				uploadPromises.push(
					imageUploadService
						.uploadImage({
							evento: "ProdutoMusicalInfraCamarim",
							idCadastro: activeProduct.id,
							file: dressingRoomFile,
						})
						.then((url) => ({ type: "dressing-room-promise", url }))
				);
			}

			if (stageMapFile) {
				// Reset the uploaded URL if needed
				if (finalStageMapUrl) {
					await imageUploadService.deleteImage({
						evento: "ProdutoMusicalMapaPalco",
						idCadastro: activeProduct.id,
					});
				}

				uploadPromises.push(
					imageUploadService
						.uploadImage({
							evento: "ProdutoMusicalMapaPalco",
							idCadastro: activeProduct.id,
							file: stageMapFile,
						})
						.then((url) => ({ type: "stage-map-promise", url }))
				);
			}

			const uploadResults = await Promise.all(uploadPromises);

			uploadResults.forEach((response) => {
				if (response.type === "rider-promise") {
					finalRiderUrl = response.url;
					setRiderFileUrl(response.url);
				}
				if (response.type === "dressing-room-promise") {
					finalDressingRoomUrl = response.url;
					setDressingRoomFileUrl(response.url);
				}
				if (response.type === "stage-map-promise") {
					finalStageMapUrl = response.url;
					setStageMapUrl(response.url);
				}
			});

			//Remove all HTML tags and then check if the text should be sent.
			const riderText = technicalData.riderTexto
				? removeHtml(technicalData.riderTexto)
				: "";

			const dressingRoomText = technicalData.infraCamarimTexto
				? removeHtml(technicalData.infraCamarimTexto)
				: "";

			const data = {
				riderTexto: riderText.length > 0 ? technicalData.riderTexto : "",
				rider: finalRiderUrl ?? null,
				infraCamarim: finalDressingRoomUrl ?? null,
				infraCamarimTexto: dressingRoomText
					? technicalData.infraCamarimTexto
					: "",
				camarimIncluso: hasDressingRoom,
				mapaPalco: stageMapData,
				mapaPalcoLink: finalStageMapUrl ?? null,
			};

			await updateMusicalProductMutation.mutateAsync({
				id: activeProduct.id,
				...data,
			});

			toast.success("Rider e Configurações Técnicas salvos com sucesso");
		} catch (error: any) {
			console.error("Error saving technical data:", error);
			toast.error("Erro ao salvar configurações técnicas");
		} finally {
			setLoading(false);
		}
	};

	const ContentRider = () => {
		if (riderFileUrl || riderFile) {
			return (
				<div>
					<span className="block text-sm font-medium text-gray-700 mb-1">
						Upload do Rider
					</span>
					<FileCard
						title="Rider"
						onClick={async () => {
							await removeFile("ProdutoMusicalRider");
						}}
					/>
				</div>
			);
		} else {
			return (
				<FileUploadBox
					acceptedTypes={["application/pdf"]}
					maxSizeMB={100}
					onFileSelected={handleRiderFileUpload}
				/>
			);
		}
	};

	const ContentDressingRoom = () => {
		if (dressingRoomFileUrl || dressingRoomFile) {
			return (
				<div>
					<span className="block text-sm font-medium text-gray-700">
						Upload do Camarim
					</span>
					<FileCard
						title="Camarim"
						onClick={async () => {
							await removeFile("ProdutoMusicalInfraCamarim");
						}}
					/>
				</div>
			);
		} else {
			return (
				<FileUploadBox
					acceptedTypes={["application/pdf"]}
					maxSizeMB={100}
					onFileSelected={handleCamarimFileUpload}
				/>
			);
		}
	};

	const ContentStageMap = () => {
		if (stageMapUrl || stageMapFile) {
			return (
				<div>
					<span className="block text-sm font-medium text-gray-700 mb-1">
						Upload do Mapa de Palco
					</span>
					<FileCard
						title="Mapa de Palco"
						onClick={async () => {
							await removeFile("ProdutoMusicalMapaPalco");
						}}
					/>
				</div>
			);
		} else {
			return (
				<FileUploadBox
					acceptedTypes={["application/pdf"]}
					maxSizeMB={100}
					onFileSelected={handleStageMapFileUpload}
				/>
			);
		}
	};

	return (
		<AccountLayout
			headerIcon={<MapIcon className="text-primary-700" size={24} />}
			headerTitle="Rider e Configurações Técnicas"
		>
			<div className="flex flex-col w-full h-full gap-4 lg:gap-6 overflow-y-auto px-1 sm:px-0">
				<form
					className="flex flex-col w-full h-full gap-4 lg:gap-6"
					onSubmit={handleSubmit(onSubmit)}
				>
					{/* Section of the Rider */}
					<div className={styles.sectionContainer}>
						<div className={styles.sectionTitle}>
							<h2 className={styles.titleText}>Rider Técnico</h2>

							<TooltipCustom
								trigger={<HelpCircle className="w-4 h-4 cursor-pointer" />}
								content="Especifique as necessidades técnicas e logísticas para sua
          apresentação. Informações sobre equipamento de som, iluminação,
          instrumentos e requisitos de palco em geral."
							/>
						</div>

						<div className="w-full overflow-x-auto">
							<IconTabNavigation
								currentTab={riderTab}
								tabs={riderTabs}
								onChange={setRiderTab}
							/>
						</div>
						<div className="mt-3 sm:mt-4">
							{riderTab === "upload" ? (
								<div className="space-y-3">
									<ContentRider />
								</div>
							) : (
								<Controller
									control={control}
									name="riderTexto"
									render={({ field }) => (
										<SimpleEditor
											value={field.value ?? ""}
											onChange={field.onChange}
										/>
									)}
								/>
							)}
						</div>
					</div>

					{/* Section of the Dressing Room */}
					<div className={styles.sectionContainer}>
						<div className={styles.sectionTitle}>
							<h2 className={styles.titleText}>Camarim</h2>

							<TooltipCustom
								trigger={<HelpCircle className="w-4 h-4 cursor-pointer" />}
								content={`Especifique as necessidades do Camarim: alimentação, 
                  bebidas, itens de estrutura (como espelho, sofá, cadeiras, ar-condicionado, etc.)`}
							/>
						</div>

						<ToggleSwitch
							className="mb-6"
							checked={hasDressingRoom}
							label="Não Necessita de Camarim"
							name="dressingRoom"
							setChecked={setHasDressingRoom}
						/>

						{!hasDressingRoom && (
							<>
								<div className="w-full overflow-x-auto">
									<IconTabNavigation
										currentTab={dressingRoomTab}
										tabs={camarimTabs}
										onChange={setDressingRoomTab}
									/>
								</div>
								<div className="mt-3 sm:mt-4">
									{dressingRoomTab === "upload" ? (
										<div className="space-y-3">
											<ContentDressingRoom />
										</div>
									) : (
										<Controller
											control={control}
											name="infraCamarimTexto"
											render={({ field }) => (
												<SimpleEditor
													value={field.value ?? ""}
													onChange={field.onChange}
												/>
											)}
										/>
									)}
								</div>
							</>
						)}
					</div>

					{/* Section of the Stage Map */}
					<div className={styles.sectionContainer}>
						<div className={styles.sectionTitle}>
							<h2 className={styles.titleText}>Mapa de Palco</h2>

							<TooltipCustom
								trigger={<HelpCircle className="w-4 h-4 cursor-pointer" />}
								content="Especifique as necessidades técnicas para sua
          apresentação. Informações sobre o posicionamento do equipamento de som, iluminação,
          instrumentos e requisitos de palco em geral."
							/>
						</div>

						<div className="w-full overflow-x-auto">
							<IconTabNavigation
								currentTab={stageMapTab}
								tabs={stageMapTabs}
								onChange={setStageMapTab}
							/>
						</div>
						<div className="mt-3 sm:mt-4">
							{stageMapTab === "upload" ? (
								<div className="space-y-3">
									<ContentStageMap />
								</div>
							) : (
								<div className={styles.sectionContainer}>
									<p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
										Crie um mapa detalhado da disposição dos equipamentos no
										palco.
									</p>
									<div className="flex flex-col w-full items-center bg-white border border-gray-200 rounded-lg py-4 sm:py-6 px-3 sm:px-4 gap-3 sm:gap-4">
										<div className="flex flex-col w-full items-center gap-2 sm:gap-3 text-center">
											<div
												className={`h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center rounded-full ${
													stageMapData.length > 0
														? "bg-green-100"
														: "bg-primary-100"
												}`}
											>
												<MapIcon
													size={24}
													className={`sm:w-8 sm:h-8 ${
														stageMapData.length > 0
															? "text-green-600"
															: "text-primary-600"
													}`}
												/>
											</div>
											<div className="px-2 sm:px-0">
												<h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-1 sm:mb-2">
													{stageMapData.length > 0
														? "Mapa de Palco Salvo"
														: "Crie o seu mapa de palco"}
												</h3>
												<p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-md">
													{stageMapData.length > 0
														? `Seu mapa de palco está configurado com ${stageMapData.length} elemento${stageMapData.length > 1 ? "s" : ""}. Você pode editá-lo a qualquer momento.`
														: "Organize a disposição da banda no palco, personalizando músicos, instrumentos e equipamentos para facilitar a montagem e logística do evento."}
												</p>
											</div>
										</div>
										<div className="flex flex-col w-full max-w-xs sm:max-w-md gap-2 sm:gap-3 items-center justify-center px-2 sm:px-0">
											<div className="flex gap-2 w-full flex-col sm:flex-row">
												{stageMapData.length > 0 ? (
													<Button
														className="w-full text-sm sm:text-base py-2 sm:py-3"
														type="button"
														variant={"outline"}
														onClick={() => {
															setIsOpenViewStageMap(true);
														}}
													>
														<span>Visualizar Palco</span>
													</Button>
												) : null}

												<Button
													className="w-full text-sm sm:text-base py-2 sm:py-3"
													type="button"
													variant={
														stageMapData.length > 0 ? "outline" : "primary"
													}
													onClick={() => {
														setIsStageBuilderOpen(true);
													}}
												>
													{stageMapData.length > 0 ? (
														<>
															<span className="hidden sm:inline">
																Editar Mapa de Palco
															</span>
															<span className="sm:hidden">Editar Palco</span>
														</>
													) : (
														<>
															<span className="hidden sm:inline">
																Criar Mapa de Palco
															</span>
															<span className="sm:hidden">Criar Palco</span>
														</>
													)}
												</Button>
											</div>

											{stageMapData.length > 0 && (
												<Button
													className="w-full text-sm sm:text-base py-2 sm:py-3"
													type="button"
													variant="danger"
													onClick={() => {
														handleStageMapSave([]);
													}}
												>
													<>
														<span className="hidden sm:inline">
															Apagar Mapa de Palco
														</span>
														<span className="sm:hidden">Apagar Palco</span>
													</>
												</Button>
											)}
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Navigation buttons */}
					<div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3 items-stretch sm:items-center justify-end mt-4 lg:mt-6 px-1 sm:px-0">
						<Button
							className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-sm sm:text-base py-2 sm:py-3"
							type="button"
							variant="outline"
							onClick={() => {
								onActiveSection("media");
							}}
						>
							<div className="flex items-center gap-1">
								<ChevronLeft />
								Voltar
							</div>
						</Button>

						<Button
							className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-sm sm:text-base py-2 sm:py-3"
							type="submit"
							disabled={loading}
						>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

							<div className="flex items-center gap-1">
								{loading ? "Salvando..." : "Salvar"}
							</div>
						</Button>
					</div>
				</form>

				{/* Stage Map Builder - Outside form to prevent unwanted submissions */}
				<StageMapBuilder
					isOpen={isStageBuilderOpen}
					onSave={handleStageMapSave}
					onClose={() => {
						setIsStageBuilderOpen(false);
					}}
					initialElements={initialStageElements}
				/>
			</div>

			<ViewStageMapModal
				isOpen={isOpenViewStageMap}
				setIsOpen={setIsOpenViewStageMap}
			>
				<StageMapArea
					stageMapList={activeProduct?.mapaPalco ?? []}
					instrumentsData={instrumentsData}
				/>
			</ViewStageMapModal>
		</AccountLayout>
	);
}

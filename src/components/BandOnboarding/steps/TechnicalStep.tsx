import { useState, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
	Guitar,
	Loader2,
	MapIcon,
	Settings,
	Drum,
	MicVocal,
	Volume2,
	KeyboardMusic,
	Music,
	HelpCircle,
	ChevronRight,
	ChevronLeft,
} from "lucide-react";
import { imageUploadService, onboardingService } from "../../../api";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { Button } from "../../ui/Button/Button";
import { IconTabNavigation } from "../../ui/IconTabNavigation/IconTabNavigation";
import { FileUploadBox } from "../../forms/FileUploadBox/FileUploadBox";
import { StageMapBuilder } from "@/components/StageMap/StageMapBuilder";
import { StepLayout } from "../../BandRegister/layout/StepLayout/StepLayout";
import {
	type StageMapData,
	type StageElement,
	STAGE_COLORS,
} from "@/components/StageMap/types";
import { TooltipCustom } from "@/components/ui/TooltipCustom/TooltipCustom";
import { useOnboardingData } from "@/hooks/useMusicalProducts";
import { SimpleEditor } from "@/components/forms/SimpleEditor/SimpleEditor";
import { FileCard } from "@/components/cards/FileCard/FileCard";
import { ToggleSwitch } from "@/components/forms/ToggleSwitch/ToggleSwitch";
import type {
	FileEventType,
	FilterOption,
	OnboardingApiResponse,
} from "@/api/types";
import { useInstrumentos } from "@/hooks/useFilters";
import { toast } from "sonner";
import { decryptValue } from "@/utils/encryptValue";

// Define styles consistent with modern interface pattern
const styles = {
	titleText: "text-gray-700 text-sm font-medium",
	sectionContainer: "bg-gray-50 py-4 sm:py-6 border-b-2 border-gray-200",
	sectionTitle: "flex items-center gap-2 mb-3 sm:mb-4",
	sectionIcon: "text-blue-600 flex-shrink-0",
};

// Helper function to get icon for instrument
function getInstrumentIcon(instrumentName: string) {
	const name = instrumentName.toLowerCase();
	if (name.includes("guitarra") || name.includes("guitar"))
		return <Guitar size={24} />;
	if (name.includes("bateria") || name.includes("drum"))
		return <Drum size={24} />;
	if (name.includes("microfone") || name.includes("mic"))
		return <MicVocal size={24} />;
	if (name.includes("teclado") || name.includes("keyboard"))
		return <KeyboardMusic size={24} />;
	if (name.includes("baixo") || name.includes("bass"))
		return <Music size={24} />;
	if (name.includes("amplificador") || name.includes("amp"))
		return <Volume2 size={24} />;
	return <MicVocal size={24} />;
}

// Helper function to convert saved StageMapData back to StageElement format
function convertStageMapDataToElements(
	stageMapData: Array<StageMapData>,
	instrumentsData: Array<FilterOption>
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
				icon: getInstrumentIcon(instrument.Nome),
				category: "instrument" as const,
				color: STAGE_COLORS.instrument,
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
	mapaPalco: z
		.array(
			z.object({
				idInstrumento: z.number(),
				posicaoX: z.number(),
				posicaoY: z.number(),
			})
		)
		.optional(),
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

type TechnicalFormData = z.infer<typeof technicalSchema>;

export default function TechnicalStep() {
	const [loading, setLoading] = useState(false);
	const [isStageBuilderOpen, setIsStageBuilderOpen] = useState(false);
	const navigate = useNavigate();

	const { updateData, markStepComplete } = useOnboarding();

	const { data } = useOnboardingData();

	const searchParameters = useSearch({ from: "/band/register/onboarding/4" });
	const onboardingID = searchParameters.registerId
		? decryptValue(searchParameters.registerId ?? "")
		: null;
	const onboardingType = searchParameters.type ?? null;

	const onboardingData = useMemo<OnboardingApiResponse | undefined>(() => {
		if (!data?.length) return undefined;

		if (onboardingType === "new-onboarding") return undefined;

		if (onboardingID)
			return data.find((item) => item.id === Number(onboardingID));

		return data[0];
	}, [data, onboardingID, onboardingType]);

	const produtoMusicalId = onboardingData ? onboardingData.id : 0;

	const { data: instrumentsData } = useInstrumentos();

	// Step4 UI pattern state
	const [riderTab, setRiderTab] = useState("upload");
	const [riderFile, setRiderFile] = useState<File | null>(null);
	const [riderFileUrl, setRiderFileUrl] = useState<string | null>(null);

	const [hasDressingRoom, setHasDressingRoom] = useState(
		onboardingData?.camarimIncluso ?? false
	);
	const [dressingRoomTab, setDressingRoomTab] = useState("upload");
	const [dressingRoomFile, setDressingRoomFile] = useState<File | null>(null);
	const [dressingRoomFileUrl, setDressingRoomFileUrl] = useState<string | null>(
		null
	);

	// const [infraCamarim, setInfraCamarim] = useState("");
	const [stageMapData, setStageMapData] = useState<Array<StageMapData>>([]);

	// Get initial media data from onboarding context
	const initialTechinicalData: TechnicalFormData = useMemo(() => {
		return {
			rider: onboardingData?.rider ?? null,
			riderTexto: onboardingData?.riderTexto ?? null,
			infraCamarim: onboardingData?.infraCamarim ?? null,
			infraCamarimTexto: onboardingData?.infraCamarimTexto ?? null,
			camarimIncluso: onboardingData?.camarimIncluso ?? false,
			mapaPalco: onboardingData?.mapaPalco ?? [],
		};
	}, [onboardingData]);

	// Convert saved stage map data to initial elements for the builder
	const initialStageElements = useMemo(() => {
		return convertStageMapDataToElements(stageMapData, instrumentsData ?? []);
	}, [stageMapData, instrumentsData]);

	const { handleSubmit, control, reset, getValues } =
		useForm<TechnicalFormData>({
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

	const removeFile = async (eventType: FileEventType) => {
		try {
			// It only makes a request to remove an image from Azure if it exists there.
			if (
				(eventType === "ProdutoMusicalOnboardingRider" &&
					onboardingData?.rider) ||
				(eventType === "ProdutoMusicalOnboardingInfraCamarim" &&
					onboardingData?.infraCamarim)
			) {
				await onboardingService.deleteImage({
					idCadastro: produtoMusicalId,
					evento: eventType,
				});
			}

			if (eventType === "ProdutoMusicalOnboardingRider") {
				setRiderFileUrl(null);
				setRiderFile(null);
			}

			if (eventType === "ProdutoMusicalOnboardingInfraCamarim") {
				setDressingRoomFileUrl(null);
				setDressingRoomFile(null);
			}
		} catch (error) {
			console.error(error);
		}
	};

	const handleStageMapSave = (stageElements: Array<StageMapData>) => {
		// Only update if the data actually changed
		if (JSON.stringify(stageMapData) !== JSON.stringify(stageElements)) {
			setStageMapData(stageElements);

			const { infraCamarim, riderTexto, rider } = getValues();

			// Update the context immediately to ensure data persistence
			const updatedTechnicalData = {
				rider: rider && rider.trim() !== "" ? rider : null,
				riderTexto: riderTexto && riderTexto.trim() !== "" ? riderTexto : null,
				infraCamarim:
					infraCamarim && infraCamarim.trim() !== "" ? infraCamarim : null,
				camarimIncluso: hasDressingRoom,
				mapaPalco: stageElements,
			};
			updateData("technical", updatedTechnicalData);
		}
		setIsStageBuilderOpen(false);
	};

	const removeHtml = (text: string): string => {
		return text
			.replace(/<[^>]+>/g, "")
			.replace(/&nbsp;/g, " ")
			.trim();
	};

	const onSubmit = async (technicalData: TechnicalFormData) => {
		if (!produtoMusicalId) {
			console.error("ID do produto musical não encontrado");
			toast.error("Erro: ID do produto musical não encontrado");
			return;
		}

		setLoading(true);
		try {
			let finalRiderUrl = riderFileUrl || onboardingData?.rider || null;
			let finalDressingRoomUrl =
				dressingRoomFileUrl || onboardingData?.infraCamarim || null;

			if (riderFile) {
				// Reset the uploaded URL if needed
				if (finalRiderUrl) {
					await onboardingService.deleteImage({
						evento: "ProdutoMusicalOnboardingRider",
						idCadastro: produtoMusicalId,
					});
				}

				const newUrl = await imageUploadService.uploadImage({
					evento: "ProdutoMusicalOnboardingRider",
					idCadastro: produtoMusicalId,
					file: riderFile,
				});

				finalRiderUrl = newUrl;
				setRiderFileUrl(newUrl);
			}

			if (dressingRoomFile) {
				// Handle file upload for Dressing Room if needed
				if (finalDressingRoomUrl) {
					await onboardingService.deleteImage({
						evento: "ProdutoMusicalOnboardingInfraCamarim",
						idCadastro: produtoMusicalId,
					});
				}

				const newUrl = await imageUploadService.uploadImage({
					evento: "ProdutoMusicalOnboardingInfraCamarim",
					idCadastro: produtoMusicalId,
					file: dressingRoomFile,
				});

				finalDressingRoomUrl = newUrl;
				setDressingRoomFileUrl(newUrl);
			}

			//Remove all HTML tags and then check if the text should be sent.
			const riderText = technicalData.riderTexto
				? removeHtml(technicalData.riderTexto)
				: "";

			const dressingRoomText = technicalData.infraCamarimTexto
				? removeHtml(technicalData.infraCamarimTexto)
				: "";

			const data = {
				riderTexto: riderText.length > 0 ? technicalData.riderTexto : null,
				rider: finalRiderUrl ?? null,
				infraCamarim: finalDressingRoomUrl ?? null,
				infraCamarimTexto: dressingRoomText
					? technicalData.infraCamarimTexto
					: null,
				camarimIncluso: hasDressingRoom,
				mapaPalco: stageMapData,
			};

			await onboardingService.updateTechnical(produtoMusicalId, data);

			updateData("technical", data);
			markStepComplete("4");

			toast.success("Rider e Configurações Técnicas salvos com sucesso");

			await navigate({ to: "/band/register/onboarding/5" });
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
							await removeFile("ProdutoMusicalOnboardingRider");
						}}
					/>
				</div>
			);
		} else {
			return (
				<FileUploadBox
					acceptedTypes={["application/pdf"]}
					maxSizeMB={10}
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
							await removeFile("ProdutoMusicalOnboardingInfraCamarim");
						}}
					/>
				</div>
			);
		} else {
			return (
				<FileUploadBox
					acceptedTypes={["application/pdf"]}
					maxSizeMB={10}
					onFileSelected={handleCamarimFileUpload}
				/>
			);
		}
	};

	return (
		<StepLayout
			currentStep={4}
			headerIcon={<MapIcon className="text-blue-600" size={24} />}
			headerTitle="Rider e Configurações Técnicas"
		>
			<div className="flex flex-col w-full h-full gap-4 lg:gap-6 overflow-y-auto px-1 sm:px-0">
				<form
					className="flex flex-col w-full h-full gap-4 lg:gap-6"
					onSubmit={handleSubmit(onSubmit)}
				>
					{/* Seção do Rider Técnico */}
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

					{/* Seção do Camarim */}
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

					{/* Seção do Mapa de Palco */}
					<div className={styles.sectionContainer}>
						<div className={styles.sectionTitle}>
							<Settings className={styles.sectionIcon} size={24} />
							<h2 className={styles.titleText}>Mapa de Palco</h2>
						</div>
						<p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
							Crie um mapa detalhado da disposição dos equipamentos no palco.
						</p>
						<div className="flex flex-col w-full items-center bg-white border border-gray-200 rounded-lg py-4 sm:py-6 px-3 sm:px-4 gap-3 sm:gap-4">
							<div className="flex flex-col w-full items-center gap-2 sm:gap-3 text-center">
								<div
									className={`h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center rounded-full ${
										stageMapData.length > 0 ? "bg-green-100" : "bg-blue-100"
									}`}
								>
									<MapIcon
										size={24}
										className={`sm:w-8 sm:h-8 ${
											stageMapData.length > 0
												? "text-green-600"
												: "text-blue-600"
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
								<Button
									className="w-full text-sm sm:text-base py-2 sm:py-3"
									type="button"
									variant={stageMapData.length > 0 ? "outline" : "primary"}
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

					{/* Navigation buttons */}
					<div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3 items-stretch sm:items-center justify-end mt-4 lg:mt-6 px-1 sm:px-0">
						<Button
							className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-sm sm:text-base py-2 sm:py-3"
							type="button"
							variant="outline"
							onClick={async () => {
								await navigate({ to: "/band/register/onboarding/3" });
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
								{loading ? "Salvando..." : "Continuar"}
								<ChevronRight />
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
		</StepLayout>
	);
}

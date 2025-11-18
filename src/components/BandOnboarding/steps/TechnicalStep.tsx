import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// TODO: Implement proper toast system
// import { useToast } from "../../ui/use-toast";
import {
	Guitar,
	Loader2,
	MapIcon,
	Settings,
	FileText,
	Home,
	Drum,
	MicVocal,
	Volume2,
	KeyboardMusic,
	Music,
} from "lucide-react";
import { onboardingService } from "../../../api";
import { useNavigate } from "@tanstack/react-router";
import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { useFileUpload } from "../../../hooks/useFileUpload";
import { Button } from "../../ui/Button/Button";
import { IconTabNavigation } from "../../ui/IconTabNavigation/IconTabNavigation";
import { FileUploadBox } from "../../forms/FileUploadBox/FileUploadBox";
import { ToggleSwitch } from "../../forms/ToggleSwitch/ToggleSwitch";
import { TextAreaField } from "../../forms/TextAreaField/TextAreaField";
import StageMapBuilder from "../StageMapBuilder/StageMapBuilder";
import { StepLayout } from "../../BandRegister/layout/StepLayout/StepLayout";
import type { StageMapData, StageElement } from "../StageMapBuilder/types";
import { STAGE_COLORS } from "../StageMapBuilder/types";

// Define styles consistent with modern interface pattern
const styles = {
	titleText: "text-gray-800 font-semibold text-lg sm:text-xl",
	sectionContainer: "bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200",
	sectionTitle: "flex items-center gap-2 mb-3 sm:mb-4",
	sectionIcon: "text-blue-600 flex-shrink-0",
};

// Mock instruments data (should match the one in StageMapBuilder)
const MOCK_INSTRUMENTS = [
	{ Id: 1, Nome: "Guitarra Elétrica" },
	{ Id: 2, Nome: "Bateria" },
	{ Id: 3, Nome: "Microfone" },
	{ Id: 4, Nome: "Teclado" },
	{ Id: 5, Nome: "Baixo" },
	{ Id: 6, Nome: "Amplificador" },
];

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
	stageMapData: Array<StageMapData>
): Array<StageElement> {
	return stageMapData
		.map((item, index) => {
			const instrument = MOCK_INSTRUMENTS.find(
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
		.transform((value) => (value && value.trim() !== "" ? value : undefined)),
	infraCamarim: z
		.string()
		.optional()
		.transform((value) => (value && value.trim() !== "" ? value : undefined)),
	camarimIncluso: z.boolean().default(false),
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

type TechnicalFormData = z.infer<typeof technicalSchema>;

export default function TechnicalStep() {
	const [loading, setLoading] = useState(false);
	const [isStageBuilderOpen, setIsStageBuilderOpen] = useState(false);
	const navigate = useNavigate();
	// TODO: Implement proper toast system
	// const { toast } = useToast();
	const { updateData, markStepComplete, onboardingData, produtoMusicalId } =
		useOnboarding();
	const fileUploadMutation = useFileUpload();

	// Step4 UI pattern state
	const [riderTab, setRiderTab] = useState("digital");
	const [camarim, setCamarim] = useState(false);
	const [digitalRider, setDigitalRider] = useState("");
	const [riderFile, setRiderFile] = useState<File | null>(null);
	const [riderFileUrl, setRiderFileUrl] = useState<string | null>(null);
	const [infraCamarim, setInfraCamarim] = useState("");
	const [stageMapData, setStageMapData] = useState<Array<StageMapData>>([]);

	// Convert saved stage map data to initial elements for the builder
	const initialStageElements = useMemo(() => {
		return convertStageMapDataToElements(stageMapData);
	}, [stageMapData]);

	const form = useForm<TechnicalFormData>({
		resolver: zodResolver(technicalSchema),
		defaultValues: onboardingData["technical"] ?? {
			rider: "",
			infraCamarim: "",
			camarimIncluso: false,
			mapaPalco: [],
		},
	});
	// Sync form values with Step4 state
	useEffect(() => {
		const formData = form.getValues();
		setDigitalRider(formData.rider ?? "");
		setInfraCamarim(formData.infraCamarim ?? "");
		setCamarim(formData.camarimIncluso ?? false);
		setStageMapData(formData.mapaPalco ?? []);
	}, [form]);

	// Load existing technical data from context or API
	useEffect(() => {
		const loadExistingData = async () => {
			if (!produtoMusicalId) return;

			// First try to load from context (faster)
			const existingData = onboardingData["technical"] as
				| TechnicalFormData
				| undefined;
			if (
				existingData &&
				(existingData.mapaPalco?.length ||
					existingData.rider ||
					existingData.infraCamarim)
			) {
				setStageMapData(existingData.mapaPalco || []);

				// Check if rider is a URL (uploaded file) or text (digital rider)
				if (existingData.rider) {
					if (
						existingData.rider.startsWith("http") ||
						existingData.rider.includes("/")
					) {
						// It's a file URL
						setRiderTab("upload");
						setRiderFileUrl(existingData.rider);
					} else {
						// It's digital rider text
						setDigitalRider(existingData.rider);
					}
				}

				setInfraCamarim(existingData.infraCamarim || "");
				setCamarim(existingData.camarimIncluso || false);
				return;
			}

			// If no data in context, try to load from API
			try {
				const allOnboardingData = await onboardingService.getOnboarding(
					Number(produtoMusicalId)
				);
				if (allOnboardingData && (allOnboardingData as any).technical) {
					const technicalData = (allOnboardingData as any)
						.technical as TechnicalFormData;
					setStageMapData(technicalData.mapaPalco || []);

					// Check if rider is a URL (uploaded file) or text (digital rider)
					if (technicalData.rider) {
						if (
							technicalData.rider.startsWith("http") ||
							technicalData.rider.includes("/")
						) {
							// It's a file URL
							setRiderTab("upload");
							setRiderFileUrl(technicalData.rider);
						} else {
							// It's digital rider text
							setDigitalRider(technicalData.rider);
						}
					}

					setInfraCamarim(technicalData.infraCamarim || "");
					setCamarim(technicalData.camarimIncluso || false);

					// Update context with loaded data
					updateData("technical", technicalData);
				}
			} catch (error) {
				console.error("Erro ao carregar dados do onboarding:", error);
				// If API fails, still try to use any data from context
				if (existingData) {
					setStageMapData(existingData.mapaPalco || []);

					// Check if rider is a URL or text
					if (existingData.rider) {
						if (
							existingData.rider.startsWith("http") ||
							existingData.rider.includes("/")
						) {
							setRiderTab("upload");
							setRiderFileUrl(existingData.rider);
						} else {
							setDigitalRider(existingData.rider);
						}
					}

					setInfraCamarim(existingData.infraCamarim || "");
					setCamarim(existingData.camarimIncluso || false);
				}
			}
		};

		void loadExistingData();
	}, [produtoMusicalId, updateData, onboardingData]);

	// Sync Step4 state with form - with debounce to prevent unwanted triggers
	useEffect(() => {
		// Only update form if values actually changed to prevent unnecessary triggers
		const currentFormValues = form.getValues();

		const newRiderValue = riderTab === "digital" ? digitalRider : "";
		if (currentFormValues.rider !== newRiderValue) {
			form.setValue("rider", newRiderValue, {
				shouldDirty: false,
				shouldTouch: false,
			});
		}

		if (currentFormValues.infraCamarim !== infraCamarim) {
			form.setValue("infraCamarim", infraCamarim, {
				shouldDirty: false,
				shouldTouch: false,
			});
		}

		if (currentFormValues.camarimIncluso !== camarim) {
			form.setValue("camarimIncluso", camarim, {
				shouldDirty: false,
				shouldTouch: false,
			});
		}

		// Use JSON.stringify for deep comparison of arrays/objects
		if (
			JSON.stringify(currentFormValues.mapaPalco) !==
			JSON.stringify(stageMapData)
		) {
			form.setValue("mapaPalco", stageMapData, {
				shouldDirty: false,
				shouldTouch: false,
			});
		}
	}, [digitalRider, infraCamarim, camarim, stageMapData, riderTab, form]);

	const handleRiderFileUpload = (file: File | null) => {
		setRiderFile(file);
		// Reset the uploaded URL when a new file is selected
		if (file) {
			setRiderFileUrl(null);
		}
	};
	const handleStageMapSave = (stageElements: Array<StageMapData>) => {
		// Only update if the data actually changed
		if (JSON.stringify(stageMapData) !== JSON.stringify(stageElements)) {
			setStageMapData(stageElements);

			// Update the context immediately to ensure data persistence
			const updatedTechnicalData = {
				rider:
					digitalRider && digitalRider.trim() !== "" ? digitalRider : undefined,
				infraCamarim:
					infraCamarim && infraCamarim.trim() !== "" ? infraCamarim : undefined,
				camarimIncluso: camarim,
				mapaPalco: stageElements,
			};
			updateData("technical", updatedTechnicalData);
		}
		setIsStageBuilderOpen(false);
	};

	const onSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!produtoMusicalId) {
			console.error("ID do produto musical não encontrado");
			alert("Erro: ID do produto musical não encontrado");
			return;
		}

		setLoading(true);
		try {
			// Handle file upload for rider if needed
			let riderUrl = digitalRider;
			if (riderFile && riderTab === "upload") {
				// Upload the file only if we haven't uploaded it yet
				if (!riderFileUrl) {
					try {
						const uploadResult = await fileUploadMutation.mutateAsync({
							file: riderFile,
							type: "document",
						});
						riderUrl = uploadResult.url;
						setRiderFileUrl(uploadResult.url);
					} catch (uploadError) {
						console.error("Erro ao fazer upload do arquivo:", uploadError);
						alert("Erro ao fazer upload do arquivo PDF");
						setLoading(false);
						return;
					}
				} else {
					// Use the previously uploaded URL
					riderUrl = riderFileUrl;
				}
			}
			const data = {
				rider: riderUrl && riderUrl.trim() !== "" ? riderUrl : undefined,
				infraCamarim:
					infraCamarim && infraCamarim.trim() !== "" ? infraCamarim : undefined,
				camarimIncluso: camarim,
				mapaPalco: stageMapData,
			};

			await onboardingService.updateTechnical(Number(produtoMusicalId), data);

			updateData("technical", {
				rider: riderUrl && riderUrl.trim() !== "" ? riderUrl : undefined,
				infraCamarim:
					infraCamarim && infraCamarim.trim() !== "" ? infraCamarim : undefined,
				camarimIncluso: camarim,
				mapaPalco: stageMapData,
			});
			markStepComplete("4");

			await navigate({ to: "/band/register/onboarding/5" });
		} catch (error: any) {
			console.error("Error saving technical data:", error);
			alert("Erro ao salvar configurações técnicas");
		} finally {
			setLoading(false);
		}
	};

	const riderTabs = [
		{
			label: "Rider Digital",
			value: "digital",
			icon: null,
		},
		{
			label: "Upload Arquivo",
			value: "upload",
			icon: null,
		},
	];

	return (
		<StepLayout
			currentStep={4}
			headerIcon={<Guitar size={24} />}
			headerTitle="Rider e Configurações Técnicas"
		>
			<div className="flex flex-col w-full h-full gap-4 lg:gap-6 overflow-y-auto px-1 sm:px-0">
				<form
					className="flex flex-col w-full h-full gap-4 lg:gap-6"
					onSubmit={onSubmit}
				>
					{/* Seção do Rider Técnico */}
					<div className={styles.sectionContainer}>
						<div className={styles.sectionTitle}>
							<FileText className={styles.sectionIcon} size={24} />
							<h2 className={styles.titleText}>Rider Técnico</h2>
						</div>
						<p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
							Defina os requisitos técnicos para suas apresentações.
						</p>
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
									<FileUploadBox
										acceptedTypes={["application/pdf"]}
										maxSizeMB={10}
										onFileSelected={handleRiderFileUpload}
									/>
									{fileUploadMutation.isPending && (
										<div className="flex items-center gap-2 text-blue-600 text-sm">
											<Loader2 className="animate-spin h-4 w-4" />
											<span>Fazendo upload do arquivo...</span>
										</div>
									)}
									{riderFileUrl && (
										<div className="flex items-center gap-2 text-green-600 text-sm">
											<FileText className="h-4 w-4" />
											<span>Arquivo enviado com sucesso!</span>
										</div>
									)}
									{fileUploadMutation.isError && (
										<div className="text-red-600 text-sm">
											Erro ao fazer upload do arquivo. Por favor, tente
											novamente.
										</div>
									)}
								</div>
							) : (
								<TextAreaField
									label="Descrição do Rider"
									name="digital_rider"
									placeholder="Descreva os equipamentos, instrumentos e requisitos técnicos necessários..."
									value={digitalRider}
									onChange={(event) => {
										setDigitalRider(event.target.value);
									}}
								/>
							)}
						</div>
					</div>

					{/* Seção do Camarim */}
					<div className={styles.sectionContainer}>
						<div className={styles.sectionTitle}>
							<Home className={styles.sectionIcon} size={24} />
							<h2 className={styles.titleText}>Camarim</h2>
						</div>
						<p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
							Defina se você oferece camarim e quais são as especificações.
						</p>
						<ToggleSwitch
							checked={camarim}
							label="Camarim incluído no valor"
							name="camarim"
							setChecked={setCamarim}
						/>
						{camarim && (
							<div className="mt-3 sm:mt-4">
								<TextAreaField
									label="Infraestrutura do Camarim"
									name="infra_camarim"
									placeholder="Descreva a infraestrutura do camarim (toalhas, água, espelho, ar-condicionado, etc.)..."
									value={infraCamarim}
									onChange={(event) => {
										setInfraCamarim(event.target.value);
									}}
								/>
							</div>
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
							</div>
						</div>
					</div>

					{/* Navigation buttons */}
					<div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-3 items-stretch sm:items-center justify-between mt-4 lg:mt-6 px-1 sm:px-0">
						<Button
							className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-sm sm:text-base py-2 sm:py-3"
							type="button"
							variant="outline"
							onClick={async () => {
								await navigate({ to: "/band/register/onboarding/3" });
							}}
						>
							Voltar
						</Button>
						<Button
							className="w-full sm:w-auto min-w-0 sm:min-w-[120px] text-sm sm:text-base py-2 sm:py-3"
							type="submit"
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
									<span className="hidden sm:inline">Salvando...</span>
									<span className="sm:hidden">Salvando</span>
								</>
							) : (
								"Próximo"
							)}
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

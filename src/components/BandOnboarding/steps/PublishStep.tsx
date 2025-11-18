import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
	Loader2,
	CheckCircle,
	AlertCircle,
	PenSquareIcon,
	ExternalLink,
} from "lucide-react";
import { onboardingService, musicalProductService } from "../../../api";
import { Button } from "../../ui/Button/Button";
import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { StepLayout } from "../../BandRegister/layout/StepLayout/StepLayout";

export default function PublishStep() {
	const [loading, setLoading] = useState(false);
	const [fetchingProduct, setFetchingProduct] = useState(true);
	const [productData, setProductData] = useState<any>(null);
	const navigate = useNavigate();
	const { onboardingData, completedSteps, produtoMusicalId, clearData } =
		useOnboarding();

	const requiredSteps = [1, 2, 3, 4, 5];

	useEffect(() => {
		const fetchProductData = async () => {
			if (!produtoMusicalId) {
				setFetchingProduct(false);
				return;
			}

			try {
				const data = await musicalProductService.getOnboardingData(
					Number(produtoMusicalId)
				);
				setProductData(data);
			} catch (error) {
				console.error("Error fetching product data:", error);
			} finally {
				setFetchingProduct(false);
			}
		};

		fetchProductData();
	}, [produtoMusicalId, completedSteps]);

	// Enhanced step validation based on actual data
	const getStepStatus = (stepNumber: number) => {
		// First check if step is marked as completed locally
		const isMarkedComplete = completedSteps.includes(stepNumber.toString());

		// If we have fetched product data, use it for additional validation
		if (productData) {
			// Check if etapaCadastro indicates this step is completed
			const isCompletedByEtapa =
				productData.etapaCadastro && productData.etapaCadastro >= stepNumber;
			// For now, trust the local completion status since we don't know the exact API structure
			// Log what fields exist for debugging

			if (stepNumber === 3) {}

			// Always prioritize local completion status, then etapaCadastro, then field validation
			switch (stepNumber) {
				case 1: // Contact
					if (isMarkedComplete || isCompletedByEtapa) return true;
					return !!(
						productData.email ||
						productData.telefone ||
						productData.razaoSocial
					);

				case 2: // Details
					if (isMarkedComplete || isCompletedByEtapa) return true;
					return !!(productData.nome && productData.descricao);

				case 3: // Media
					if (isMarkedComplete || isCompletedByEtapa) return true;
					// Check for redeSocial array, videosYouTube array, or spotifyPlaylistId
					return !!(
						(productData.redeSocial && productData.redeSocial.length > 0) ||
						(productData.videosYouTube &&
							productData.videosYouTube.length > 0) ||
						(productData.spotifyPlaylistId &&
							productData.spotifyPlaylistId.trim() !== "")
					);

				case 4: // Images
					if (isMarkedComplete || isCompletedByEtapa) return true;
					return !!(
						productData.fotoPerfil ||
						productData.logomarca ||
						(productData.imagens && productData.imagens.length > 0)
					);

				case 5: // Technical
					if (isMarkedComplete || isCompletedByEtapa) return true;
					return !!(
						(productData.mapaPalco && productData.mapaPalco.length > 0) ||
						productData.rider ||
						productData.infraCamarim ||
						productData.camarimIncluso
					);

				case 6: // Schedule
					if (isMarkedComplete || isCompletedByEtapa) return true;
					// For now, just check if marked complete since agenda structure is not clear
					return false;

				default:
					return false;
			}
		}

		// Fallback to local data check if product data not loaded

		switch (stepNumber) {
			case 1: // Contact
				const contactData = onboardingData["contact"] as any;
				return isMarkedComplete && contactData && contactData.nome;

			case 2: // Details
				const detailsData = onboardingData["details"] as any;
				return isMarkedComplete && detailsData && detailsData.nome;

			case 3: // Media
				const mediaData = onboardingData["media"] as any;
				return isMarkedComplete && mediaData;

			case 4: // Images
				const imagesData = onboardingData["images"] as any;
				return isMarkedComplete && imagesData;

			case 5: // Technical
				const technicalData = onboardingData["technical"] as any;
				return isMarkedComplete && technicalData;

			case 6: // Schedule
				const scheduleData = onboardingData["schedule"] as any;
				return isMarkedComplete && scheduleData;

			default:
				return false;
		}
	};

	const allStepsCompleted = requiredSteps.every((step) => getStepStatus(step));

	const getStepUrl = (stepNumber: number) => {
		return `/band/register/onboarding/${stepNumber}`;
	};

	const handlePublish = async () => {
		if (!produtoMusicalId) {
			alert("Erro: ID do produto musical não encontrado");
			return;
		}

		if (!allStepsCompleted) {
			alert("Atenção: Complete todos os passos antes de publicar");
			return;
		}

		setLoading(true);
		try {
			await onboardingService.publish(Number(produtoMusicalId));
			clearData();
			setTimeout(() => {
				void navigate({
					to: "/band/profile/$id",
					params: { id: produtoMusicalId.toString() },
				});
			}, 2000);
		} catch (error: any) {
			console.error("Error publishing:", error);
			alert("Erro ao publicar produto musical");
		} finally {
			setLoading(false);
		}
	};

	const stepNames: Record<number, string> = {
		1: "Informações de Contato",
		2: "Informações Profissionais",
		3: "Mídias e Redes Sociais",
		4: "Configurações Técnicas",
		5: "Agenda",
	};

	return (
		<StepLayout
			currentStep={6}
			headerIcon={<PenSquareIcon />}
			headerTitle="Publicar"
		>
			<div className="container mx-auto px-4 py-8 max-w-2xl">
				<div className="text-center space-y-2 mb-8">
					<h2 className="text-3xl font-bold text-gray-800">
						Revisão e Publicação
					</h2>
					<p className="text-gray-600">
						Revise as informações antes de publicar seu produto musical
					</p>
				</div>

				{fetchingProduct ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<span className="ml-3 text-gray-600">
							Carregando informações do produto...
						</span>
					</div>
				) : (
					<>
						<div className="bg-white rounded-lg shadow-md p-6 mb-8">
							<h3 className="font-semibold text-xl text-gray-700 mb-4">
								Status dos Passos
							</h3>
							<div className="grid grid-cols-1 gap-3">
								{requiredSteps.map((step) => {
									const isCompleted = getStepStatus(step);
									return (
										<div
											key={step}
											className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
										>
											<div className="flex items-center gap-3">
												{isCompleted ? (
													<CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
												) : (
													<AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
												)}
												<span
													className={`font-medium ${
														isCompleted ? "text-green-700" : "text-yellow-700"
													}`}
												>
													{stepNames[step]}
												</span>
											</div>

											{!isCompleted && (
												<Button
													variant="outline"
													size="sm"
													onClick={() => navigate({ to: getStepUrl(step) })}
													className="flex items-center gap-2 text-sm"
												>
													<span>Completar</span>
													<ExternalLink className="h-4 w-4" />
												</Button>
											)}

											{isCompleted && (
												<span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
													Concluído
												</span>
											)}
										</div>
									);
								})}
							</div>
						</div>

						{(productData || onboardingData["details"]) && (
							<div className="border border-gray-200 rounded-lg p-6 mb-8 bg-white shadow-md">
								<h3 className="font-semibold text-xl text-gray-700 mb-4">
									Resumo
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-base">
									<div>
										<span className="font-medium text-gray-600">Nome:</span>{" "}
										{productData
											? productData.nome
											: String((onboardingData["details"] as any)?.nome ?? "")}
									</div>
									<div className="md:col-span-2">
										<span className="font-medium text-gray-600">
											Descrição:
										</span>{" "}
										{productData
											? productData.descricao
											: String(
													(onboardingData["details"] as any)?.descricao ?? ""
												)}
									</div>
									{productData?.cidade && (
										<div>
											<span className="font-medium text-gray-600">Cidade:</span>{" "}
											{typeof productData.cidade === "object"
												? productData.cidade.nome
												: productData.cidade}
										</div>
									)}
									{productData?.estado && (
										<div>
											<span className="font-medium text-gray-600">Estado:</span>{" "}
											{typeof productData.estado === "object"
												? productData.estado.nome
												: productData.estado}
										</div>
									)}
								</div>
							</div>
						)}

						{!allStepsCompleted ? (
							<div className="bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-lg p-4 mb-8">
								<div className="flex items-start gap-3">
									<AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
									<div>
										<p className="font-medium mb-2">
											Complete todos os passos obrigatórios antes de publicar
										</p>
										<p className="text-sm text-yellow-700">
											{
												requiredSteps.filter((step) => !getStepStatus(step))
													.length
											}{" "}
											passo(s) pendente(s). Use os botões "Completar" acima para
											ir diretamente a cada etapa.
										</p>
									</div>
								</div>
							</div>
						) : (
							<div className="bg-green-50 border border-green-300 text-green-800 rounded-lg p-4 mb-8">
								<div className="flex items-center gap-3">
									<CheckCircle className="h-6 w-6 text-green-600" />
									<div>
										<p className="font-medium">
											Todos os passos foram concluídos!
										</p>
										<p className="text-sm text-green-700 mt-1">
											Seu produto musical está pronto para ser publicado.
										</p>
									</div>
								</div>
							</div>
						)}

						<div className="flex flex-col sm:flex-row justify-between gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate({ to: "/band/register/onboarding/5" })}
								className="w-full sm:w-auto"
							>
								Voltar
							</Button>
							<Button
								onClick={handlePublish}
								disabled={loading || !allStepsCompleted}
								className="w-full sm:w-auto min-h-[44px]"
							>
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Publicando...
									</>
								) : (
									"Publicar"
								)}
							</Button>
						</div>
					</>
				)}
			</div>
		</StepLayout>
	);
}

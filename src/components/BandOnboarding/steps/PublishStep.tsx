import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
	Loader2,
	CheckCircle,
	AlertCircle,
	PenSquareIcon,
	ExternalLink,
	ChevronLeft,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { StepLayout } from "../layout/StepLayout/StepLayout";
import { useCurrentOnboarding } from "../hooks/useCurrentOnboarding";
import { encryptValue } from "@/utils/encryptValue";
import { PreviewProfileModal } from "../PreviewProfileModal";

export default function PublishStep() {
	const navigate = useNavigate();

	const { onboardingData, isFetching, isStepDone } = useCurrentOnboarding();

	const produtoMusicalId = onboardingData ? onboardingData.id : 0;

	const requiredSteps = [1, 2, 3, 4, 5];

	const allStepsCompleted = onboardingData?.etapaCadastro === 6;

	const [openPreviewProfile, setOpenPreviewProfile] = useState(false);

	const getStepUrl = (stepNumber: number) => {
		return `/band/register/onboarding/${stepNumber}`;
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
			headerIcon={<PenSquareIcon className="text-primary-700" size={24} />}
			headerTitle="Publicar"
		>
			<div className="container mx-auto px-0 sm:px-4 py-2 sm:py-8 max-w-2xl">
				<div className="text-center space-y-2 mb-8">
					<h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
						Revisão e Publicação
					</h2>
					<p className="text-gray-600">
						Revise as informações antes de publicar seu produto musical
					</p>
				</div>

				{isFetching ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<span className="ml-3 text-gray-600">
							Carregando informações do produto...
						</span>
					</div>
				) : (
					<>
						<div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8">
							<h3 className="font-semibold text-xl text-gray-700 mb-4">
								Status dos Passos
							</h3>
							<div className="grid grid-cols-1 gap-3">
								{requiredSteps.map((step) => {
									const isCompleted = isStepDone(step);

									return (
										<div
											key={step}
											className="flex items-center justify-between gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
										>
											<div className="flex min-w-0 items-center gap-3">
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
													onClick={async () => {
														const search = onboardingData?.id
															? {
																	registerId: encryptValue(
																		onboardingData.id.toString()
																	),
																}
															: {};

														await navigate({
															to: getStepUrl(step),
															search,
														});
													}}
													className="flex items-center gap-2 text-sm"
												>
													<span>Completar</span>
													<ExternalLink className="h-4 w-4" />
												</Button>
											)}

											{isCompleted && (
												<span className="shrink-0 text-green-600 text-xs sm:text-sm font-medium bg-green-50 px-2 sm:px-3 py-1 rounded-full">
													Concluído
												</span>
											)}
										</div>
									);
								})}
							</div>
						</div>

						{onboardingData && (
							<div className="border border-gray-200 rounded-lg p-4 sm:p-6 mb-8 bg-white shadow-md">
								<h3 className="font-semibold text-xl text-gray-700 mb-4">
									Resumo
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-base">
									<div>
										<span className="font-medium text-gray-600">Nome:</span>{" "}
										{onboardingData.nome}
									</div>
									<div className="md:col-span-2">
										<span className="font-medium text-gray-600">
											Descrição:
										</span>{" "}
										{onboardingData.descricao}
									</div>
									{onboardingData.cidade && (
										<div>
											<span className="font-medium text-gray-600">Cidade:</span>{" "}
											{onboardingData.cidade.nome}
										</div>
									)}
									{onboardingData.estadoContato && (
										<div>
											<span className="font-medium text-gray-600">Estado:</span>{" "}
											{onboardingData.estadoContato}
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
												requiredSteps.filter(
													(step) => !(step === onboardingData?.etapaCadastro)
												).length
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

						<div className="flex flex-col sm:flex-row justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={async () => {
									const search = onboardingData?.id
										? {
												registerId: encryptValue(onboardingData.id.toString()),
											}
										: {};

									await navigate({
										to: "/band/register/onboarding/5",
										search,
									});
								}}
								className="w-full sm:w-auto"
							>
								<div className="flex items-center gap-1">
									<ChevronLeft />
									Voltar
								</div>
							</Button>

							<Button
								// onClick={handlePublish}
								onClick={() => {
									setOpenPreviewProfile(true);
								}}
								disabled={!allStepsCompleted}
								className="w-full sm:w-auto min-h-[44px]"
							>
								Visualizar Perfil
							</Button>
						</div>
					</>
				)}
			</div>

			{onboardingData && (
				<PreviewProfileModal
					isOpen={openPreviewProfile}
					setIsOpen={setOpenPreviewProfile}
					musicalProduct={onboardingData}
					allStepsCompleted={allStepsCompleted}
					produtoMusicalId={produtoMusicalId}
				/>
			)}
		</StepLayout>
	);
}

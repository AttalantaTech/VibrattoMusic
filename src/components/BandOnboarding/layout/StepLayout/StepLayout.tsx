import { AudioLines, AwardIcon, Check, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useToastStore } from "../../../../store/toast/toastStore";
import { FinishModal } from "../../FinishModal/FinishModal";
import { OnboardingHeader } from "../../../BandOnboarding/OnboardingHeader/OnboardingHeader";
import { Button } from "@/components/ui/button";

interface StepLayoutProps {
	children: ReactNode; // current step
	currentStep: number;
	headerTitle: string;
	headerIcon: ReactNode;
	isFinishing?: boolean;
	onClick?: () => void;
	buttonTitle?: string;
}

const styles = {
	active: {
		stepNumBox: "bg-[#d6f2ff]",
		stepNum: "text-[#007BFF]",
		stepText: "font-semibold",
	},
	inactive: {
		stepNumBox: "bg-gray-200",
		stepNum: "text-gray-900",
		stepText: "font-medium",
	},
	completed: {
		stepNumBox: "bg-[#d1fadf]",
		stepNum: "",
		stepText: "font-medium",
	},
};

export const StepLayout = ({
	children,
	currentStep,
	headerIcon,
	headerTitle,
	isFinishing = false,
	onClick,
	buttonTitle,
}: StepLayoutProps) => {
	const router = useRouter();
	const { addToast } = useToastStore();
	const steps = [
		"Informações de Contato",
		"Informações Profissionais",
		"Mídia Kit e Visibilidade",
		"Rider e Configurações Técnicas",
		"Agenda",
	];

	const [isFinishStepOpen, setIsFinishStepOpen] = useState(false);

	const handleSkipOnboarding = async () => {
		addToast({
			message:
				"Tudo bem, mais tarde você pode preencher essa informação na tela de Configurações do Perfil",
			type: "info",
		});
		await router.navigate({ to: "/" });
	};

	return (
		<div className="flex flex-col min-h-screen justify-start items-center bg-white">
			<OnboardingHeader />

			<main className="flex flex-col items-center justify-center w-full">
				<div className="flex flex-col w-full items-center justify-start px-4 sm:px-6 md:px-12 lg:px-20 xl:px-28 gap-5 pb-8">
					{/* Header */}
					<div className="flex flex-col items-center justify-center w-full gap-3 my-4 md:my-8">
						<AudioLines color="rgba(0, 123, 255, 1)" size={40} />
						<h1 className="text-gray-900 font-bold text-xl md:text-2xl">
							Cadastre sua banda
						</h1>

						<div className="max-w-screen-md">
							<h4 className="text-sm font-normal text-center text-gray-600 sm:text-xl">
								Preencher todos os campos de contrato é obrigatório para
								realizar o cadastro. Já os dados artísticos da banda podem ser
								editados posteriormente.
							</h4>
						</div>
					</div>

					<div className="flex flex-col lg:flex-row w-full gap-4 lg:gap-8">
						<div className="w-full lg:w-2/5 xl:w-[40%] border border-gray-200 bg-gray-50 rounded-lg p-4 md:p-6 lg:p-7 order-2 lg:order-1 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
							{steps.map((step, index) => {
								let status: "active" | "inactive" | "completed";
								if (currentStep === index + 1) {
									status = "active";
								} else if (currentStep > index + 1) {
									status = "completed";
								} else {
									status = "inactive";
								}

								return (
									<div key={index} className="flex flex-col w-full">
										<div className="flex items-center justify-between w-full py-3 md:py-4">
											<div className="flex items-center gap-2">
												<div
													className={`p-1.5 md:p-2 rounded-full w-8 h-8 md:w-9 md:h-9 flex items-center justify-center ${styles[status].stepNumBox}`}
												>
													<span
														className={`font-bold text-base md:text-xl ${styles[status].stepNum}`}
													>
														{status === "completed" ? (
															<Check
																color="#039855"
																size={20}
																className="md:w-6 md:h-6"
															/>
														) : (
															index + 1
														)}
													</span>
												</div>
												<span
													className={`text-sm md:text-base lg:text-lg text-gray-900 ${styles[status].stepText}`}
												>
													{step}
												</span>
											</div>
											<ChevronRight
												className="text-gray-800 hidden md:block"
												size={24}
											/>
										</div>
										<hr className="w-full border-t border-gray-200 my-2" />
									</div>
								);
							})}
							<div className="flex flex-col w-full">
								<div className="flex items-center justify-between w-full py-3 md:py-4">
									<div className="flex items-center gap-2">
										<div
											className={`p-1.5 md:p-2 rounded-full w-8 h-8 md:w-9 md:h-9 flex items-center justify-center`}
										>
											<span className={`font-bold text-base md:text-xl`}>
												<AwardIcon
													color="#007bff"
													size={28}
													className="md:w-9 md:h-9"
												/>
											</span>
										</div>
										<span
											className={`text-sm md:text-base lg:text-lg text-gray-900 ${isFinishing && "font-semibold"}`}
										>
											Finalização
										</span>
									</div>
									<ChevronRight
										className="text-gray-800 hidden md:block"
										size={24}
									/>
								</div>
								<hr className="w-full border-t border-gray-200 my-2" />
							</div>

							{/* Skip Onboarding Option */}
							<div className="flex flex-col w-full mt-4">
								<div className="text-end">
									<button
										onClick={handleSkipOnboarding}
										className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
									>
										Quero preencher essas informações mais tarde...
									</button>
								</div>
							</div>
						</div>

						<div className="w-full lg:w-3/5 xl:w-[60%] order-1 lg:order-2">
							<div className="flex flex-col w-full h-full items-center justify-center p-4 md:p-6 lg:p-8 gap-4 md:gap-6 border border-gray-200 bg-gray-50 rounded-lg text-left">
								<div className="w-full flex items-center">
									<div className="flex w-full items-center gap-3 md:gap-6">
										<div className="flex items-center justify-center bg-[#d6f2ff] p-2 md:p-3 rounded">
											{headerIcon}
										</div>
										<h1 className="text-gray-900 font-bold text-lg md:text-xl lg:text-2xl">
											{headerTitle}
										</h1>
									</div>

									{currentStep === 1 ? (
										<Button className="w-full sm:w-auto" onClick={onClick}>
											{buttonTitle ?? ""}
										</Button>
									) : null}
								</div>

								<hr className="w-full" />
								{children}
							</div>
						</div>
					</div>

					<FinishModal
						isOpen={isFinishStepOpen}
						onClose={() => {
							setIsFinishStepOpen(false);
						}}
						onFinish={() => {
							setIsFinishStepOpen(false);
						}}
					/>
				</div>
			</main>
		</div>
	);
};

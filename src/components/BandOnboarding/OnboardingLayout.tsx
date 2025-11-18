import { Outlet, useRouter } from "@tanstack/react-router";
import { useContext } from "react";
import { OnboardingContext } from "../../contexts/context/OnboardingContext";
import { cn } from "../../lib/utils/cn";
import { Progress } from "../ui/Progress/Progress";
import { OnboardingHeader } from "./OnboardingHeader/OnboardingHeader";

const steps = [
	{ number: 1, name: "Contato", path: "/band/register/onboarding/1" },
	{ number: 2, name: "Detalhes", path: "/band/register/onboarding/2" },
	{ number: 3, name: "Mídias", path: "/band/register/onboarding/3" },
	{ number: 4, name: "Técnico", path: "/band/register/onboarding/4" },
	{ number: 5, name: "Agenda", path: "/band/register/onboarding/5" },
	{ number: 6, name: "Publicar", path: "/band/register/onboarding/6" },
];

export default function OnboardingLayout() {
	const router = useRouter();
	const context = useContext(OnboardingContext);

	const currentPath = router.state.location.pathname;
	const currentStepIndex = steps.findIndex((step) => step.path === currentPath);
	const progress = ((currentStepIndex + 1) / steps.length) * 100;

	const canAccessStep = (stepNumber: number) => {
		if (stepNumber === 1) return true;
		try {
			return context?.isStepComplete(`step-${stepNumber - 1}`) ?? false;
		} catch {
			return false;
		}
	};

	const handleStepClick = async (step: {
		number: number;
		name: string;
		path: string;
	}) => {
		if (canAccessStep(step.number)) {
			await router.navigate({ to: step.path });
		}
	};

	return (
		<div className="flex flex-col w-screen h-screen justify-start items-center">
			<OnboardingHeader />
			<main className="flex flex-col items-center justify-start w-full h-full overflow-y-auto">
				<div className="min-h-full bg-gray-50 w-full">
					<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
						<div className="mb-6 sm:mb-8">
							<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center sm:text-left">
								Cadastro de Produto Musical
							</h1>
							<p className="text-sm sm:text-base text-gray-600 text-center sm:text-left">
								Complete todos os passos para publicar seu produto musical
							</p>
						</div>

						{/* Mobile Step Indicator */}
						<div className="block sm:hidden mb-6">
							<div className="flex items-center justify-center mb-4">
								<div className="flex items-center space-x-2">
									<div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
										{currentStepIndex + 1}
									</div>
									<span className="text-gray-600 text-sm">
										de {steps.length}
									</span>
								</div>
							</div>
							<div className="text-center">
								<h2 className="text-lg font-medium text-gray-900">
									{steps[currentStepIndex]?.name}
								</h2>
							</div>
						</div>

						{/* Desktop Step Indicator */}
						<div className="hidden sm:block mb-6 lg:mb-8">
							<div className="flex items-center justify-between mb-4">
								{steps.map((step, index) => (
									<div
										key={step.number}
										className="flex items-center cursor-pointer"
										onClick={() => handleStepClick(step)}
									>
										<div
											className={cn(
												"flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 transition-colors text-sm sm:text-base",
												currentStepIndex >= index
													? "border-blue-600 bg-blue-600 text-white"
													: canAccessStep(step.number)
														? "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
														: "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
											)}
										>
											{context?.isStepComplete(`step-${step.number}`) ? (
												<svg
													className="w-4 h-4 sm:w-5 sm:h-5"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fillRule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clipRule="evenodd"
													/>
												</svg>
											) : (
												step.number
											)}
										</div>
										{index < steps.length - 1 && (
											<div
												className={cn(
													"w-full h-1 mx-1 sm:mx-2",
													currentStepIndex > index
														? "bg-blue-600"
														: "bg-gray-200"
												)}
											/>
										)}
									</div>
								))}
							</div>
							<div className="flex justify-between text-xs sm:text-sm">
								{steps.map((step) => (
									<span
										key={step.number}
										className={cn(
											"font-medium text-center",
											currentStepIndex + 1 >= step.number
												? "text-blue-600"
												: "text-gray-500"
										)}
									>
										{step.name}
									</span>
								))}
							</div>
						</div>

						<Progress value={progress} className="mb-6 sm:mb-8" />

						<div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
							<Outlet />
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

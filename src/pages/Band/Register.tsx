import { OnboardingHeader } from "../../components/BandOnboarding/OnboardingHeader/OnboardingHeader";
import { AdvantagesCard } from "../../components/BandRegister/AdvantagesCard/AdvantagesCard";
import {
	BandRegistrationProvider,
	useBandRegistration,
} from "../../contexts/BandRegistrationContext";
import { useNavigate } from "@tanstack/react-router";

const BandRegisterInner = () => {
	const { state } = useBandRegistration();
	const navigate = useNavigate();

	const { currentStep } = state;

	const renderStep = () => {
		switch (currentStep) {
			case "initial":
				return (
					<AdvantagesCard
						onStart={async () => {
							// Navigate to first onboarding step
							await navigate({ to: "/band/register/onboarding/1" });
						}}
						onSkip={async () => {
							// Skip full onboarding and go to profile area; keep profile incomplete
							await navigate({ to: "/band/me", search: { tab: "settings" } });
						}}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="flex flex-col w-full min-h-[100dvh] justify-start items-center">
			<OnboardingHeader />

			<main className="flex flex-1 flex-col items-center justify-center w-full px-4 py-6 sm:px-0">
				{renderStep()}
			</main>
		</div>
	);
};

export const BandRegister = () => {
	return (
		<BandRegistrationProvider>
			<BandRegisterInner />
		</BandRegistrationProvider>
	);
};

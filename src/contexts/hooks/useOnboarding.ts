import { useContext } from "react";
import { OnboardingContext } from "../context/OnboardingContext";
import type { OnboardingContextType } from "../types/OnboardingContext.types";

export const useOnboarding = (): OnboardingContextType => {
	const context = useContext(OnboardingContext);

	if (!context || context._debugProviderId === "default") {
		console.error(
			"❌ useOnboarding: Context not found or using default context!"
		);
		throw new Error("useOnboarding must be used within OnboardingProvider");
	}

	return context;
};

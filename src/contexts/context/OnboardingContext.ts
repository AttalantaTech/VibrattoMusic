import { createContext } from "react";
import type { OnboardingContextType } from "../types/OnboardingContext.types";

const defaultContext: OnboardingContextType = {
	onboardingData: {},
	updateData: () => {},
	markStepComplete: () => {},
	isStepComplete: () => false,
	completedSteps: [],
	clearData: () => {},
	produtoMusicalId: null,
	setProdutoMusicalId: () => {},
	_debugProviderId: "default",
};

export const OnboardingContext =
	createContext<OnboardingContextType>(defaultContext);

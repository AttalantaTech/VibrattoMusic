export interface OnboardingData {
	[key: string]: unknown;
	contact?: Record<string, unknown>;
}

export interface OnboardingContextType {
	onboardingData: OnboardingData;
	updateData: (step: string, data: unknown) => void;
	markStepComplete: (step: string) => void;
	isStepComplete: (step: string) => boolean;
	completedSteps: Array<string>;
	clearData: () => void;
	produtoMusicalId: string | null;
	setProdutoMusicalId: (id: string | null) => void;
	_debugProviderId?: string; // Added for debugging
}

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Option } from "../components/forms/Select/Select";
import type {
	OnboardingDetails,
	OnboardingMedia,
	OnboardingImages,
	OnboardingTechnicalConfig,
	OnboardingSchedule,
} from "../api/types";

export interface BandRegistrationState {
	// Profile Type Selection
	profileTypes: Array<Option>;

	// Product ID from Step 1
	productId?: number;

	// Step 1 - Contact Information (returns { id: number })
	step1Data?: { id: number };

	// Step 2 - Band Information
	step2Data?: OnboardingDetails;

	// Step 3 - Media Kit (returns combined media and images data)
	step3Data?: { mediaData: OnboardingMedia; imagesData: OnboardingImages };

	// Step 4 - Technical Configuration
	step4Data?: OnboardingTechnicalConfig;

	// Step 5 - Schedule
	step5Data?: OnboardingSchedule;

	// Current step tracking
	currentStep: string;

	// Completion status for each step
	completedSteps: Set<string>;
}

interface BandRegistrationContextType {
	state: BandRegistrationState;
	updateProfileTypes: (types: Array<Option>) => void;
	updateProductId: (id: number) => void;
	updateStep1Data: (data: { id: number }) => void;
	updateStep2Data: (data: OnboardingDetails) => void;
	updateStep3Data: (data: {
		mediaData: OnboardingMedia;
		imagesData: OnboardingImages;
	}) => void;
	updateStep4Data: (data: OnboardingTechnicalConfig) => void;
	updateStep5Data: (data: OnboardingSchedule) => void;
	setCurrentStep: (step: string) => void;
	markStepCompleted: (step: string) => void;
	isStepCompleted: (step: string) => boolean;
	resetRegistration: () => void;
}

// Common interface for all step components
export interface StepProps {
	productId?: number;
	onNext?: () => void;
	onPrevious?: () => void;
	isValid?: boolean;
	onValidationChange?: (isValid: boolean) => void;
}

const initialState: BandRegistrationState = {
	profileTypes: [],
	currentStep: "initial",
	completedSteps: new Set<string>(),
};

// Load state from localStorage
const loadPersistedState = (): BandRegistrationState => {
	try {
		const saved = localStorage.getItem("bandRegistrationState");

		if (saved) {
			const parsed = JSON.parse(saved) as Partial<BandRegistrationState> & {
				completedSteps?: Array<string>;
			}; 
			
			// Convert completedSteps back to Set and merge with initial state
			const loadedState = {
				...initialState,
				...parsed,
				completedSteps: new Set(parsed.completedSteps ?? []),
			};

			return loadedState;
		}
	} catch (error) {
		console.warn("Failed to load persisted registration state:", error);
	}

	return initialState;
};

const BandRegistrationContext = createContext<
	BandRegistrationContextType | undefined
>(undefined);

export const useBandRegistration = () => {
	const context = useContext(BandRegistrationContext);
	if (context === undefined) {
		throw new Error(
			"useBandRegistration must be used within a BandRegistrationProvider"
		);
	}
	return context;
};

interface BandRegistrationProviderProps {
	children: ReactNode;
}

export const BandRegistrationProvider = ({
	children,
}: BandRegistrationProviderProps) => {
	const [state, setState] = useState<BandRegistrationState>(() =>
		loadPersistedState()
	);
	// Persist state changes
	const updateStateAndPersist = (newState: BandRegistrationState) => {
		// First update the state in React
		setState(newState);

		// Then persist to localStorage
		try {
			// Make sure Set is converted to Array before serialization
			const stateToSave = {
				...newState,
				completedSteps: Array.from(newState.completedSteps),
			};

			const serializedState = JSON.stringify(stateToSave);
			localStorage.setItem("bandRegistrationState", serializedState);
		} catch (error) {
			console.error("Failed to persist registration state:", error);
		}
	};

	const updateProfileTypes = (types: Array<Option>) => {
		const newState = { ...state, profileTypes: types };
		updateStateAndPersist(newState);
	};
	const updateProductId = (id: number) => {
		const newState = {
			...state,
			productId: id,
			// Ensure step1Data is also updated for consistency
			step1Data: state.step1Data || { id: id },
		};
		updateStateAndPersist(newState);
	};
	const updateStep1Data = (data: { id: number }) => {
		const newState = {
			...state,
			step1Data: data,
			// Ensure productId is also updated for consistency
			productId: data.id,
		};
		updateStateAndPersist(newState);
	};

	const updateStep2Data = (data: OnboardingDetails) => {
		const newState = { ...state, step2Data: data };
		updateStateAndPersist(newState);
	};

	const updateStep3Data = (data: {
		mediaData: OnboardingMedia;
		imagesData: OnboardingImages;
	}) => {
		const newState = { ...state, step3Data: data };
		updateStateAndPersist(newState);
	};

	const updateStep4Data = (data: OnboardingTechnicalConfig) => {
		const newState = { ...state, step4Data: data };
		updateStateAndPersist(newState);
	};

	const updateStep5Data = (data: OnboardingSchedule) => {
		const newState = { ...state, step5Data: data };
		updateStateAndPersist(newState);
	};

	const setCurrentStep = (step: string) => {
		const newState = { ...state, currentStep: step };
		updateStateAndPersist(newState);
	};

	const markStepCompleted = (step: string) => {
		const newState = {
			...state,
			completedSteps: new Set([...state.completedSteps, step]),
		};
		updateStateAndPersist(newState);
	};

	const isStepCompleted = (step: string) => {
		return state.completedSteps.has(step);
	};

	const resetRegistration = () => {
		localStorage.removeItem("bandRegistrationState");
		setState(initialState);
	};
	const value: BandRegistrationContextType = {
		state,
		updateProfileTypes,
		updateProductId,
		updateStep1Data,
		updateStep2Data,
		updateStep3Data,
		updateStep4Data,
		updateStep5Data,
		setCurrentStep,
		markStepCompleted,
		isStepCompleted,
		resetRegistration,
	};

	return (
		<BandRegistrationContext.Provider value={value}>
			{children}
		</BandRegistrationContext.Provider>
	);
};

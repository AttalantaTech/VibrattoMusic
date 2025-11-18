import { useState, useEffect, useMemo, useCallback } from "react";
import { OnboardingContext } from "./context/OnboardingContext";
import type { OnboardingData } from "./types/OnboardingContext.types";

interface OnboardingProviderProps {
	readonly children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
	// Add a unique ID to each provider instance to help with debugging
	const providerId = useMemo(
		() => Math.random().toString(36).substring(2, 10),
		[]
	);

	const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
		const saved = localStorage.getItem("onboarding-data");
		return saved ? (JSON.parse(saved) as OnboardingData) : {};
	});

	const [completedSteps, setCompletedSteps] = useState<Array<string>>(() => {
		const saved = localStorage.getItem("completed-steps");
		return saved ? (JSON.parse(saved) as Array<string>) : [];
	});

	const [produtoMusicalId, setProdutoMusicalId] = useState<string | null>(
		() => {
			const stored = localStorage.getItem("produto-musical-id");
			return stored;
		}
	);
	useEffect(() => {
		localStorage.setItem("onboarding-data", JSON.stringify(onboardingData));
	}, [onboardingData]);

	useEffect(() => {
		localStorage.setItem("completed-steps", JSON.stringify(completedSteps));
	}, [completedSteps]);

	useEffect(() => {
		if (produtoMusicalId) {
			localStorage.setItem("produto-musical-id", produtoMusicalId);
		} else {
			localStorage.removeItem("produto-musical-id");
		}
	}, [produtoMusicalId, providerId]);

	const updateData = useCallback((step: string, data: unknown) => {
		setOnboardingData((previous: OnboardingData) => ({
			...previous,
			[step]: data,
		}));
	}, []);

	const markStepComplete = useCallback((step: string) => {
		setCompletedSteps((previous: Array<string>) => {
			if (!previous.includes(step)) {
				return [...previous, step];
			}
			return previous;
		});
	}, []);

	const isStepComplete = useCallback(
		(step: string) => completedSteps.includes(step),
		[completedSteps]
	);
	const clearData = useCallback(() => {
		setOnboardingData({});
		setCompletedSteps([]);
		setProdutoMusicalId(null);
		localStorage.removeItem("onboarding-data");
		localStorage.removeItem("completed-steps");
		localStorage.removeItem("produto-musical-id");
	}, []);
	const setProdutoMusicalIdWithLogging = useCallback(
		(id: string | null) => {
			// Directly update localStorage first as a safety measure
			if (id) {
				localStorage.setItem("produto-musical-id", id);
			}

			setProdutoMusicalId(id);
		},
		[setProdutoMusicalId, produtoMusicalId, providerId]
	);
	const value = useMemo(() => {
		const contextValue = {
			onboardingData,
			updateData,
			markStepComplete,
			isStepComplete,
			completedSteps,
			clearData,
			produtoMusicalId,
			setProdutoMusicalId: setProdutoMusicalIdWithLogging,
			_debugProviderId: providerId, // Add for debugging
		};

		return contextValue;
	}, [
		onboardingData,
		updateData,
		markStepComplete,
		isStepComplete,
		completedSteps,
		clearData,
		produtoMusicalId,
		setProdutoMusicalIdWithLogging,
		providerId,
	]);

	return (
		<OnboardingContext.Provider value={value}>
			{children}
		</OnboardingContext.Provider>
	);
}

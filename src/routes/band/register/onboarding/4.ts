import { createFileRoute } from "@tanstack/react-router";
import TechnicalStep from "../../../../components/BandOnboarding/steps/TechnicalStep";
import { OnboardingProvider } from "../../../../contexts/OnboardingContext";
import { OnboardingLayout } from "../../../../components/BandOnboarding/layout/OnboardingLayout";
import React from "react";

export const Route = createFileRoute("/band/register/onboarding/4")({
	component: () => {
		return React.createElement(
			OnboardingLayout,
			null,
			React.createElement(
				OnboardingProvider,
				null,
				React.createElement(TechnicalStep)
			)
		);
	},
});

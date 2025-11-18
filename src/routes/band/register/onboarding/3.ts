import { createFileRoute } from "@tanstack/react-router";
import MediaStep from "../../../../components/BandOnboarding/steps/MediaStep";
import { OnboardingProvider } from "../../../../contexts/OnboardingContext";
import { OnboardingLayout } from "../../../../components/BandOnboarding/layout/OnboardingLayout";
import React from "react";

export const Route = createFileRoute("/band/register/onboarding/3")({
	component: () => {
		return React.createElement(
			OnboardingLayout,
			null,
			React.createElement(
				OnboardingProvider,
				null,
				React.createElement(MediaStep)
			)
		);
	},
});

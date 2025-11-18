import { createFileRoute } from "@tanstack/react-router";
import PublishStep from "../../../../components/BandOnboarding/steps/PublishStep";
import { OnboardingProvider } from "../../../../contexts/OnboardingContext";
import { OnboardingLayout } from "../../../../components/BandOnboarding/layout/OnboardingLayout";
import React from "react";

export const Route = createFileRoute("/band/register/onboarding/6")({
	component: () => {
		return React.createElement(
			OnboardingLayout,
			null,
			React.createElement(
				OnboardingProvider,
				null,
				React.createElement(PublishStep)
			)
		);
	},
});

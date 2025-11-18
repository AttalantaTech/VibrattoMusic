import { createFileRoute } from "@tanstack/react-router";
import ScheduleStep from "../../../../components/BandOnboarding/steps/ScheduleStep";
import { OnboardingProvider } from "../../../../contexts/OnboardingContext";
import { OnboardingLayout } from "../../../../components/BandOnboarding/layout/OnboardingLayout";
import React from "react";

export const Route = createFileRoute("/band/register/onboarding/5")({
	component: () => {
		return React.createElement(
			OnboardingLayout,
			null,
			React.createElement(
				OnboardingProvider,
				null,
				React.createElement(ScheduleStep)
			)
		);
	},
});

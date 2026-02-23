import { createFileRoute } from "@tanstack/react-router";
import ScheduleStep from "../../../../components/BandOnboarding/steps/ScheduleStep";
import { OnboardingProvider } from "../../../../contexts/OnboardingContext";
import { OnboardingLayout } from "../../../../components/BandOnboarding/layout/OnboardingLayout";
import React from "react";
import z from "zod";

const ProtectedStep5 = () =>
	React.createElement(
		OnboardingLayout,
		null,
		React.createElement(
			OnboardingProvider,
			null,
			React.createElement(ScheduleStep)
		)
	);

export const Route = createFileRoute("/band/register/onboarding/5")({
	component: ProtectedStep5,
	validateSearch: z.object({
		type: z.string().optional(),
		registerId: z.string().optional(),
	}),
});

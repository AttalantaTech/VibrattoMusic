import { createFileRoute } from "@tanstack/react-router";
import TechnicalStep from "../../../../components/BandOnboarding/steps/TechnicalStep";
import { OnboardingProvider } from "../../../../contexts/OnboardingContext";
import { OnboardingLayout } from "../../../../components/BandOnboarding/layout/OnboardingLayout";
import React from "react";
import z from "zod";

const ProtectedStep4 = () =>
	React.createElement(
		OnboardingLayout,
		null,
		React.createElement(
			OnboardingProvider,
			null,
			React.createElement(TechnicalStep)
		)
	);

export const Route = createFileRoute("/band/register/onboarding/4")({
	component: ProtectedStep4,
	validateSearch: z.object({
		type: z.string().optional(),
		registerId: z.string().optional(),
	}),
});

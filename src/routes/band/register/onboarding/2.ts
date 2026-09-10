import { createFileRoute } from "@tanstack/react-router";
import DetailsStep from "../../../../components/BandOnboarding/steps/DetailsStep";
import { OnboardingProvider } from "../../../../contexts/OnboardingContext";
import { OnboardingLayout } from "../../../../components/BandOnboarding/layout/OnboardingLayout";
import React from "react";
import z from "zod";
import { BandRegistrationProvider } from "@/contexts/BandRegistrationContext";

const ProtectedStep2 = () =>
	React.createElement(
		OnboardingLayout,
		null,
		React.createElement(
			BandRegistrationProvider,
			null,
			React.createElement(
				OnboardingProvider,
				null,
				React.createElement(DetailsStep)
			)
		)
	);

export const Route = createFileRoute("/band/register/onboarding/2")({
	component: ProtectedStep2,
	validateSearch: z.object({
		type: z.string().optional(),
		registerId: z.string().optional(),
	}),
});

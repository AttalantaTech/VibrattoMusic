import { createFileRoute } from "@tanstack/react-router";
import MediaStep from "../../../../components/BandOnboarding/steps/MediaStep";
import { OnboardingProvider } from "../../../../contexts/OnboardingContext";
import { OnboardingLayout } from "../../../../components/BandOnboarding/layout/OnboardingLayout";
import React from "react";
import z from "zod";

const ProtectedStep3 = () =>
	React.createElement(
		OnboardingLayout,
		null,
		React.createElement(
			OnboardingProvider,
			null,
			React.createElement(MediaStep)
		)
	);

export const Route = createFileRoute("/band/register/onboarding/3")({
	component: ProtectedStep3,
	validateSearch: z.object({
		type: z.string().optional(),
		registerId: z.string().optional(),
	}),
});

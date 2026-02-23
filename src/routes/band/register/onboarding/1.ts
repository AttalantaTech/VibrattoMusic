import { createFileRoute } from "@tanstack/react-router";
import ContactStep from "../../../../components/BandOnboarding/steps/ContactStep";
import { OnboardingProvider } from "../../../../contexts/OnboardingContext";
import { OnboardingLayout } from "../../../../components/BandOnboarding/layout/OnboardingLayout";
import React from "react";
import z from "zod";

const ProtectedStep1 = () =>
	React.createElement(
		OnboardingLayout,
		null,
		React.createElement(
			OnboardingProvider,
			null,
			React.createElement(ContactStep)
		)
	);

export const Route = createFileRoute("/band/register/onboarding/1")({
	component: ProtectedStep1,
	validateSearch: z.object({
		type: z.string().optional(),
		registerId: z.string().optional(),
	}),
});

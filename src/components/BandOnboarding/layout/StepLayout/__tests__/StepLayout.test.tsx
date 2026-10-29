import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
	useRouter: () => ({ navigate: vi.fn() }),
	useNavigate: () => vi.fn(),
}));
vi.mock("../../../OnboardingHeader/OnboardingHeader", () => ({
	OnboardingHeader: () => null,
}));
vi.mock("../../../FinishModal/FinishModal", () => ({
	FinishModal: () => null,
}));

// Progress saved on the server: steps 1 and 2 are done
let savedProgress = 3;
vi.mock("../../../hooks/useCurrentOnboarding", () => ({
	useCurrentOnboarding: () => ({
		isStepDone: (step: number) => savedProgress > step,
	}),
}));

import { StepLayout } from "../StepLayout";

// The layout scrolls to the top on each step; jsdom has no scrolling
window.scrollTo = vi.fn();

/** Steps shown with the ✓ (completed) in the sidebar */
const doneSteps = () =>
	[
		"Informações de Contato",
		"Informações Profissionais",
		"Mídia Kit e Visibilidade",
		"Rider e Configurações Técnicas",
		"Agenda",
	].filter((name) =>
		screen
			.getAllByText(name)
			.some((el) => el.parentElement?.querySelector("svg.lucide-check"))
	);

// The sidebar ✓ means "saved", not "already passed by"
describe("onboarding sidebar", () => {
	it("marks only the steps saved on the server", () => {
		savedProgress = 3;
		render(
			<StepLayout currentStep={6} headerTitle="Publicar" headerIcon={null}>
				<div />
			</StepLayout>
		);

		expect(doneSteps()).toEqual([
			"Informações de Contato",
			"Informações Profissionais",
		]);
	});

	it("marks nothing for a new registration, even on a later step", () => {
		savedProgress = 0;
		render(
			<StepLayout currentStep={4} headerTitle="Rider" headerIcon={null}>
				<div />
			</StepLayout>
		);

		expect(doneSteps()).toEqual([]);
	});
});

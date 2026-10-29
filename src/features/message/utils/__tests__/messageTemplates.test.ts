import { describe, expect, it } from "vitest";
import {
	BUDGET_REQUEST_TITLE,
	buildStatusMessage,
	entityLinks,
} from "../messageTemplates";

const proposalPayload = {
	eventTypeLabel: "Casamento",
	date: "20/12/2026",
	location: "Teatro",
};

// Chat cards sent when a proposal changes
describe("chat messages", () => {
	it("a new proposal links to that proposal (its number in the link)", () => {
		expect(entityLinks.proposalTab(292).url).toMatch(
			/band\/me\?tab=hires&id=292$/
		);
	});

	it("a budget request has its own link, not the proposal one", () => {
		const link = entityLinks.budgetRequest(15);
		expect(link.url).toMatch(/band\/me\?tab=messages&orcamento=15$/);
		expect(link.url).not.toContain("tab=hires");
	});

	it("a counter-proposal is announced as such", () => {
		const html = buildStatusMessage("proposalRequested", {
			recipientName: "Maria",
			...proposalPayload,
			counterProposal: true,
		});
		expect(html).toContain("Contraproposta recebida!");
	});

	it("a proposal card shows the standard text and the complement", () => {
		const html = buildStatusMessage("proposalRequested", {
			recipientName: "Maria",
			...proposalPayload,
			description: "Conforme solicitação, segue proposta orçamentária…",
			complement: "Inclui 2h de show",
		});
		expect(html).toContain("Conforme solicitação");
		expect(html).toContain("Complemento:");
		expect(html).toContain("Inclui 2h de show");
	});

	it("without a complement the card has no empty row", () => {
		const html = buildStatusMessage("proposalRequested", {
			recipientName: "Maria",
			...proposalPayload,
			description: "Conforme solicitação…",
		});
		expect(html).not.toContain("Complemento");
	});

	it("a regular proposal keeps its title", () => {
		const html = buildStatusMessage("proposalRequested", {
			recipientName: "Maria",
			...proposalPayload,
		});
		expect(html).toContain("Proposta criada!");
		expect(html).not.toContain("Contraproposta");
	});

	it("confirming the down payment says the hiring is complete", () => {
		const html = buildStatusMessage("proposalPaidSign", {
			recipientName: "Maria",
		});
		expect(html).toContain("A contratação está concluída");
		expect(html).not.toContain("precisa ser assinado");
	});

	it("budget cards carry the title that identifies older ones", () => {
		const html = buildStatusMessage("budgetRequested", {
			recipientName: "Banda",
			...proposalPayload,
		});
		expect(html).toContain(BUDGET_REQUEST_TITLE);
	});

	it("escapes what the user typed (no HTML injection)", () => {
		const html = buildStatusMessage("proposalRequested", {
			recipientName: "Maria",
			...proposalPayload,
			description: "<script>alert(1)</script>",
		});
		expect(html).not.toContain("<script>");
	});
});

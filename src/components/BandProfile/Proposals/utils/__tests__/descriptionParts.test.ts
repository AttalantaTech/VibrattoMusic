import { describe, expect, it } from "vitest";
import { descriptionComplement } from "../handleStandardProposalDescription";
import { proposalTitle } from "../proposalTitle";

const standard =
	"Conforme solicitação, segue proposta orçamentária para contratação da apresentação artística da(o) DJ - DJ Danilo, neste ato representada por Danilo Palma, inscrita no CPF/CNPJ 374.511.868-57";

// descricao now keeps only what the professional typed
describe("descriptionComplement", () => {
	it("a new proposal keeps the typed complement as is", () => {
		expect(descriptionComplement("Inclui 2h de show e 30 min de DJ")).toBe(
			"Inclui 2h de show e 30 min de DJ"
		);
	});

	it("an older proposal with only the standard text has no complement", () => {
		expect(descriptionComplement(standard)).toBe("");
	});

	it("an older proposal keeps the text added after the standard one", () => {
		expect(descriptionComplement(`${standard}. Som e luz inclusos.`)).toBe(
			"Som e luz inclusos."
		);
		expect(descriptionComplement(`${standard}\n\nSom e luz inclusos.`)).toBe(
			"Som e luz inclusos."
		);
	});

	it("also recognizes the old text with a dash instead of the document", () => {
		expect(
			descriptionComplement(
				"Conforme solicitação, segue proposta orçamentária para contratação da apresentação artística da(o) Banda - X, neste ato representada por -, inscrita no CPF/CNPJ -"
			)
		).toBe("");
	});

	it("handles an empty description", () => {
		expect(descriptionComplement(null)).toBe("");
		expect(descriptionComplement("   ")).toBe("");
	});
});

describe("proposalTitle", () => {
	it("names the proposal by event type and event date", () => {
		expect(
			proposalTitle({
				id: 7,
				tipoEvento: { id: 1, nome: "Casamento" },
				dataInicio: "2026-12-20T00:00:00",
			})
		).toBe("Casamento · 20/12/2026");
	});

	it("falls back to the proposal number without an event type", () => {
		expect(
			proposalTitle({
				id: 7,
				tipoEvento: { id: 0, nome: "" },
				dataInicio: "2026-12-20",
			})
		).toBe("Proposta #7 · 20/12/2026");
	});
});

import { describe, expect, it } from "vitest";
import type { ContractModel, ContractModelSection } from "../../types";
import {
	addClause,
	moveClause,
	removeClause,
	renumberTitle,
} from "../clauseOrder";
import { mergeEditable } from "../modelRules";
import { DEMO_BASE_SECTIONS } from "../demoBaseModel";

const titles = (sections: Array<ContractModelSection>) =>
	sections.map((section) => section.titulo);

describe("order of the clauses", () => {
	it("renames the ordinal of a clause to its new place", () => {
		expect(renumberTitle("CLÁUSULA SEXTA - DO FORO", 4)).toBe(
			"CLÁUSULA QUARTA - DO FORO"
		);
		expect(renumberTitle("CLÁUSULA TERCEIRA - DOS ENCARGOS", 11)).toBe(
			"CLÁUSULA DÉCIMA PRIMEIRA - DOS ENCARGOS"
		);
		expect(renumberTitle("CLÁUSULA DÉCIMA PRIMEIRA - X", 3)).toBe(
			"CLÁUSULA TERCEIRA - X"
		);
	});

	it("leaves titles without an ordinal alone", () => {
		expect(renumberTitle("CLÁUSULA DE QUEBRA DE EQUIPAMENTOS", 2)).toBe(
			"CLÁUSULA DE QUEBRA DE EQUIPAMENTOS"
		);
		expect(renumberTitle("Pagamento extra", 2)).toBe("Pagamento extra");
	});

	it("moves an editable clause and renumbers both", () => {
		const moved = moveClause(DEMO_BASE_SECTIONS, 7, -1); // Foro up
		expect(titles(moved).slice(5, 7)).toEqual([
			"CLÁUSULA QUINTA - DO FORO",
			"CLÁUSULA SEXTA - DIREITOS E OBRIGAÇÕES DO CONTRATADO",
		]);
		expect(moved.map((s) => s.numero)).toEqual(moved.map((_, i) => i));
	});

	it("never moves past Vibratto's fixed sections", () => {
		// Encargos (first editable) can't go above Valor; the last can't pass Assinaturas
		expect(moveClause(DEMO_BASE_SECTIONS, 4, -1)).toBe(DEMO_BASE_SECTIONS);
		expect(moveClause(DEMO_BASE_SECTIONS, 10, 1)).toBe(DEMO_BASE_SECTIONS);
	});

	it("adds a new clause right before the signatures", () => {
		const { sections, id } = addClause(DEMO_BASE_SECTIONS);
		expect(sections.at(-1)?.titulo).toBe("Assinaturas");
		expect(sections.at(-2)).toMatchObject({
			id,
			titulo: "CLÁUSULA DÉCIMA - NOVA CLÁUSULA",
			editavel: true,
			numero: 10,
		});
		expect(id).toBeLessThan(0);
	});

	it("removes a clause made on the screen, never a fixed one", () => {
		const { sections, id } = addClause(DEMO_BASE_SECTIONS);
		expect(removeClause(sections, id)).toHaveLength(DEMO_BASE_SECTIONS.length);
		// A fixed section is never removed
		expect(removeClause(DEMO_BASE_SECTIONS, 1)).toHaveLength(
			DEMO_BASE_SECTIONS.length
		);
	});
});

describe("saving with a new order", () => {
	const original: ContractModel = {
		id: 4,
		nome: "M",
		secoes: DEMO_BASE_SECTIONS,
	};

	it("keeps the order and the new clause chosen on the screen", () => {
		const { sections } = addClause(moveClause(DEMO_BASE_SECTIONS, 7, -1));
		const saved = mergeEditable(original, { ...original, secoes: sections });
		expect(saved.secoes).toHaveLength(DEMO_BASE_SECTIONS.length + 1);
		expect(saved.secoes[5]?.id).toBe(7);
		expect(saved.secoes.at(-1)?.titulo).toBe("Assinaturas");
	});

	it("brings back a saved clause that went missing", () => {
		const without = DEMO_BASE_SECTIONS.filter((s) => s.id !== 9);
		const saved = mergeEditable(original, { ...original, secoes: without });
		expect(saved.secoes.some((s) => s.id === 9)).toBe(true);
	});
});

import { describe, expect, it } from "vitest";
import type { ContractModel } from "../../types";
import {
	changedSections,
	isNameTaken,
	mergeEditable,
	modelErrors,
} from "../modelRules";
import {
	fillExample,
	labelOf,
	markersIn,
	removedMarkers,
	splitMarkers,
	toApiText,
	toScreenText,
	unknownMarkers,
} from "../markers";

const model: ContractModel = {
	id: 4,
	nome: "Formatura",
	secoes: [
		{
			id: 1,
			numero: 0,
			titulo: "Introdução",
			texto: "Entre [Contratante.Qualificacao] e a banda.",
			editavel: false,
		},
		{
			id: 2,
			numero: 6,
			titulo: "Do foro",
			texto: "Foro de [ProdutoMusical.CidadeContato].",
			editavel: true,
		},
	],
};

describe("saving a contract model", () => {
	it("never sends a fixed section changed", () => {
		const draft: ContractModel = {
			...model,
			secoes: model.secoes.map((s) => ({ ...s, texto: "mudei" })),
		};
		const saved = mergeEditable(model, draft);
		expect(saved.secoes[0]?.texto).toBe(model.secoes[0]?.texto);
		expect(saved.secoes[1]?.texto).toBe("mudei");
	});

	it("keeps the old name when the new one is blank", () => {
		expect(mergeEditable(model, { ...model, nome: "  " }).nome).toBe(
			"Formatura"
		);
	});

	it("lists only editable sections that changed", () => {
		const draft: ContractModel = {
			...model,
			secoes: model.secoes.map((s) => ({ ...s, texto: `${s.texto}!` })),
		};
		expect(changedSections(model, draft).map((s) => s.id)).toEqual([2]);
	});

	it("blocks an empty name or an empty editable clause", () => {
		const draft: ContractModel = {
			nome: "",
			id: 4,
			secoes: model.secoes.map((s) => ({ ...s, texto: "" })),
		};
		expect(modelErrors(draft)).toEqual([
			"Dê um nome ao modelo.",
			'A cláusula "Do foro" está vazia.',
		]);
	});

	it("finds a repeated name regardless of accents and case", () => {
		expect(
			isNameTaken("comissao de formatura", [{ nome: "Comissão de Formatura" }])
		).toBe(true);
		expect(isNameTaken("Casamento", [{ nome: "Formatura" }])).toBe(false);
	});
});

describe("markers of the contract text", () => {
	it("finds the markers once each", () => {
		expect(
			markersIn("[Proposta.Local] e [Proposta.Local] em [Proposta.DataInicio]")
		).toEqual(["[Proposta.Local]", "[Proposta.DataInicio]"]);
	});

	it("names them for people", () => {
		expect(labelOf("[Proposta.Local]")).toBe("Local do evento");
	});

	it("tells which markers were deleted while editing", () => {
		expect(
			removedMarkers(
				"Foro de [ProdutoMusical.CidadeContato].",
				"Foro de Campinas."
			)
		).toEqual(["[ProdutoMusical.CidadeContato]"]);
	});

	it("tells which markers the system doesn't know", () => {
		expect(unknownMarkers("Em [Proposta.Cidade] no [Proposta.Local]")).toEqual([
			"[Proposta.Cidade]",
		]);
	});

	it("splits the text so markers can be shown as chips", () => {
		expect(splitMarkers("No [Proposta.Local].")).toEqual([
			{ kind: "text", value: "No " },
			{ kind: "marker", value: "[Proposta.Local]" },
			{ kind: "text", value: "." },
		]);
	});

	it("fills the preview with example data", () => {
		expect(fillExample("Dia [Proposta.DataInicio]")).toBe("Dia 22/11/2026");
	});

	it("keeps the API's line breaks when saving", () => {
		const api = "1.1. A\r\n1.2. B";
		expect(toScreenText(api)).toBe("1.1. A\n1.2. B");
		expect(toApiText(toScreenText(api))).toBe(api);
	});
});

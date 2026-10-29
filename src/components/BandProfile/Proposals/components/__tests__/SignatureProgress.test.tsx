import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { ProposalResponse } from "@/api/types";
import { SignatureProgress } from "../SignatureProgress";

const proposal = (changes: Partial<ProposalResponse> = {}) =>
	({
		status: { id: 2, nome: "Aceita" },
		etapaD4Sign: { id: 5, nome: "AguardandoAssinatura" },
		contratante: { id: 7, nome: "Maria Souza" },
		nomeContratante: "",
		produtoMusicalContratante: { id: 0, nome: "" },
		produtoMusical: { id: 3, nome: "DJ Danilo" },
		assinaturaContratante: false,
		dataAssinaturaContratante: null,
		assinaturaContratado: false,
		dataAssinaturaContratado: null,
		...changes,
	}) as unknown as ProposalResponse;

const text = (p: ProposalResponse, isContractor = true) =>
	render(<SignatureProgress proposal={p} isContractor={isContractor} />)
		.container.textContent ?? "";

// While the contract is being signed (status "Aceita")
describe("SignatureProgress", () => {
	it("shows each party and who already signed, with the date", () => {
		const out = text(
			proposal({
				assinaturaContratante: true,
				dataAssinaturaContratante: "2026-10-29T14:30:00",
			})
		);

		expect(out).toContain("Contratante · Maria Souza");
		expect(out).toContain("assinado em 29/10/2026");
		expect(out).toContain("Contratado · DJ Danilo");
		expect(out).toContain("aguardando assinatura");
	});

	it("tells the viewer who signed that the other party is missing", () => {
		expect(text(proposal({ assinaturaContratante: true }), true)).toContain(
			"Você já assinou. Falta a assinatura de DJ Danilo."
		);
	});

	it("tells the band to sign when only the contractor signed", () => {
		expect(text(proposal({ assinaturaContratante: true }), false)).toContain(
			"Confira o e-mail da D4Sign para assinar"
		);
	});

	it("says the contract is being prepared before it reaches D4Sign", () => {
		expect(
			text(proposal({ etapaD4Sign: { id: 2, nome: "EnvioDocumento" } }))
		).toContain("Preparando o contrato para assinatura");
	});

	it("uses the typed name of a standalone proposal's client", () => {
		expect(
			text(
				proposal({
					contratante: { id: 0, nome: "" },
					nomeContratante: "João Avulso",
				})
			)
		).toContain("Contratante · João Avulso");
	});

	it.each(["Pendente", "AguardandoPagamento", "ContratacaoConcluida"])(
		"is hidden outside the signing step (%s)",
		(status) => {
			expect(text(proposal({ status: { id: 1, nome: status } as never }))).toBe(
				""
			);
		}
	);
});

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

	it("tells the professional the signature is theirs, before or after the down payment", () => {
		const out = text(proposal({ possuiSinalPagamento: true }), false);

		expect(out).toContain(
			"Como contratado, você é responsável por assinar o contrato."
		);
		expect(out).toContain("antes ou depois do pagamento do sinal");
	});

	it("without a down payment, only the responsibility is mentioned", () => {
		const out = text(proposal({ possuiSinalPagamento: false }), false);

		expect(out).toContain("você é responsável por assinar o contrato");
		expect(out).not.toContain("pagamento do sinal");
	});

	it("the contractor doesn't see the professional's note", () => {
		expect(text(proposal({ possuiSinalPagamento: true }), true)).not.toContain(
			"você é responsável por assinar"
		);
	});

	it("pending: the contractor learns the signature comes by e-mail after accepting", () => {
		const out = text(
			proposal({ status: { id: 1, nome: "Pendente" } as never }),
			true
		);

		expect(out).toContain(
			"Ao aceitar esta proposta, você receberá no e-mail cadastrado as orientações para a assinatura do contrato, enviadas pela D4Sign."
		);
		expect(out).toContain("Se não encontrar o e-mail, procure também em Spam");
		expect(out).not.toContain("Confira o e-mail da D4Sign");
		expect(out).not.toContain("aguardando assinatura");
	});

	it("pending: the professional sees when the e-mails go and the responsibility note", () => {
		const out = text(
			proposal({
				status: { id: 1, nome: "Pendente" } as never,
				possuiSinalPagamento: true,
			}),
			false
		);

		expect(out).toContain("Quando o contratante aceitar esta proposta");
		expect(out).toContain("você é responsável por assinar o contrato");
	});

	it.each(["AguardandoPagamento", "ContratacaoConcluida", "Rejeitada"])(
		"is hidden outside the signing step (%s)",
		(status) => {
			expect(text(proposal({ status: { id: 1, nome: status } as never }))).toBe(
				""
			);
		}
	);
});

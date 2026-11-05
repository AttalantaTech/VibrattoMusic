import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { ProposalResponse } from "@/api/types";
import { DownPaymentNotice } from "../DownPaymentNotice";
import { PAYMENT_CONDITION } from "../../utils/calculateSignal";

const proposal = (
	status: string,
	conditionId: number,
	extra: Partial<ProposalResponse> = {}
) =>
	({
		valor: 5000,
		status: { id: 1, nome: status },
		condicoesPagamento: { id: conditionId, nome: "" },
		tipoSinalPagamento: null,
		valorSinalPagamento: null,
		dataVencimentoSinalPagamento: "2026-11-28",
		produtoMusical: { id: 1, nome: "Banda X" },
		...extra,
	}) as unknown as ProposalResponse;

const noticeText = (p: ProposalResponse, isContractor = true) =>
	render(<DownPaymentNotice proposal={p} isContractor={isContractor} />)
		.container.textContent;

// The contractor's notice: from the acceptance until the payment is confirmed,
// before or after the signatures; then both sides see it was received
describe("DownPaymentNotice", () => {
	it("while signing, asks for the payment now, with amount and due date", () => {
		const text = noticeText(proposal("Aceita", PAYMENT_CONDITION.SIGNAL_50));
		expect(text).toMatch(
			/^Pagamento do sinal:Efetue o pagamento do sinal de R\$ 2\.500,00 até 28\/11\/2026/
		);
		expect(text).toMatch(/antes ou depois da assinatura do contrato/);
	});

	it("the professional has no notice before the payment", () => {
		expect(
			noticeText(proposal("Aceita", PAYMENT_CONDITION.SIGNAL_50), false)
		).toBe("");
	});

	it("once paid while signing, both sides see it was received", () => {
		const paid = proposal("Aceita", PAYMENT_CONDITION.SIGNAL_50, {
			sinalPago: true,
		});
		expect(noticeText(paid)).toMatch(
			/^Sinal recebidoBanda X confirmou o recebimento do sinal/
		);
		expect(noticeText(paid, false)).toMatch(
			/^Sinal recebidoVocê confirmou o recebimento do sinal/
		);
		expect(noticeText(paid)).not.toMatch(/Efetue o pagamento/);
	});

	it("in 'Aguardando Pagamento' asks for the payment", () => {
		expect(
			noticeText(
				proposal("AguardandoPagamento", PAYMENT_CONDITION.FULL_UPFRONT)
			)
		).toMatch(
			/^Pagamento do sinal:Efetue o pagamento do sinal de R\$ 5\.000,00/
		);
	});

	it("shows the custom amount in reais", () => {
		expect(
			noticeText(
				proposal("AguardandoPagamento", PAYMENT_CONDITION.SIGNAL_CUSTOM, {
					tipoSinalPagamento: "V",
					valorSinalPagamento: 1000,
				})
			)
		).toMatch(/R\$ 1\.000,00/);
	});

	it("shows the due date without shifting the day (UTC-3)", () => {
		expect(
			noticeText(
				proposal("AguardandoPagamento", PAYMENT_CONDITION.SIGNAL_50, {
					dataVencimentoSinalPagamento: "2026-11-01",
				})
			)
		).toMatch(/até 01\/11\/2026/);
	});

	it.each([
		[
			"the payment is confirmed",
			"ContratacaoConcluida",
			PAYMENT_CONDITION.SIGNAL_50,
		],
		["the proposal is pending", "Pendente", PAYMENT_CONDITION.SIGNAL_50],
		["there is no down payment", "Aceita", PAYMENT_CONDITION.ON_EVENT_DAY],
	])("is hidden when %s", (_, status, conditionId) => {
		expect(noticeText(proposal(status, conditionId))).toBe("");
	});
});

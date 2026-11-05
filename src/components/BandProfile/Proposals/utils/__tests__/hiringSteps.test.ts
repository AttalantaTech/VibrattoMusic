import { describe, expect, it } from "vitest";
import type { ProposalResponse } from "@/api/types";
import { hiringSteps } from "../hiringSteps";
import { PAYMENT_CONDITION } from "../calculateSignal";

const proposal = (
	status: string,
	extra: Partial<ProposalResponse> = {}
): ProposalResponse =>
	({
		valor: 5000,
		status: { id: 1, nome: status },
		contratante: { id: 7, nome: "Maria" },
		produtoMusical: { id: 3, nome: "DJ Danilo" },
		produtoMusicalContratante: null,
		condicoesPagamento: { id: PAYMENT_CONDITION.SIGNAL_50, nome: "" },
		tipoSinalPagamento: null,
		valorSinalPagamento: null,
		dataCriacao: "2026-11-05T10:00:00",
		dataVencimentoAceite: "2026-11-15",
		dataVencimentoSinalPagamento: "2026-11-28",
		assinaturaContratante: false,
		dataAssinaturaContratante: null,
		assinaturaContratado: false,
		dataAssinaturaContratado: null,
		sinalPago: false,
		motivoRejeicao: null,
		...extra,
	}) as unknown as ProposalResponse;

const summary = (p: ProposalResponse) =>
	hiringSteps(p).steps.map(
		(s) => `${s.state}: ${s.label}${s.detail ? ` (${s.detail})` : ""}`
	);

// Read from the proposal each time the progress opens, so it keeps up with
// the D4Sign signatures that happen outside the app
describe("hiringSteps", () => {
	it("a pending proposal waits for the answer until its deadline", () => {
		expect(summary(proposal("Pendente"))).toEqual([
			"done: Proposta enviada (05/11/2026)",
			"pending: Proposta aceita (até 15/11/2026)",
			"pending: Contratante assinou",
			"pending: Contratado assinou",
			"pending: Sinal pago (R$ 2.500,00 até 28/11/2026)",
			"pending: Contratação concluída",
		]);
		expect(hiringSteps(proposal("Pendente")).nextStep).toBe(
			"Maria aceita ou recusa a proposta."
		);
	});

	it("shows each signature with its date as soon as it happens", () => {
		const p = proposal("Aceita", {
			assinaturaContratante: true,
			dataAssinaturaContratante: "2026-11-06T09:00:00",
		});
		expect(summary(p)).toContain("done: Contratante assinou (06/11/2026)");
		expect(summary(p)).toContain("pending: Contratado assinou");
		expect(hiringSteps(p).nextStep).toBe(
			"Falta a assinatura de DJ Danilo (pelo e-mail da D4Sign); falta o pagamento do sinal de R$ 2.500,00 e a confirmação do recebimento por DJ Danilo."
		);
	});

	it("a down payment paid before the signatures only waits for them", () => {
		const p = proposal("Aceita", { sinalPago: true });
		expect(summary(p)).toContain("done: Sinal pago (R$ 2.500,00)");
		expect(hiringSteps(p).nextStep).toBe(
			"Falta a assinatura de Maria e DJ Danilo (pelo e-mail da D4Sign)."
		);
	});

	it("'Aguardando Pagamento' means both signed and only the payment is missing", () => {
		const p = proposal("AguardandoPagamento");
		expect(summary(p)).toContain("done: Contratante assinou");
		expect(summary(p)).toContain("done: Contratado assinou");
		expect(hiringSteps(p).nextStep).toMatch(/^Falta o pagamento do sinal/);
	});

	it("a concluded hiring has every step done and no next step", () => {
		const result = hiringSteps(proposal("ContratacaoConcluida"));
		expect(result.steps.every((s) => s.state === "done")).toBe(true);
		expect(result.nextStep).toBeNull();
		expect(result.concluded).toBe(true);
	});

	it("'À vista no dia do evento' has no down payment step", () => {
		const p = proposal("Aceita", {
			condicoesPagamento: { id: PAYMENT_CONDITION.ON_EVENT_DAY, nome: "" },
		});
		expect(summary(p).some((s) => s.includes("Sinal pago"))).toBe(false);
	});

	it.each([
		["Rejeitada", "Proposta recusada (Data indisponível)"],
		["Cancelada", "Proposta cancelada"],
		["Vencida", "Prazo vencido"],
		["Substituida", "Substituída por uma contraproposta"],
	])("'%s' ends the process", (status, last) => {
		const result = hiringSteps(
			proposal(status, { motivoRejeicao: { id: 1, nome: "Data indisponível" } })
		);
		expect(
			summary(
				proposal(status, {
					motivoRejeicao: { id: 1, nome: "Data indisponível" },
				})
			)
		).toEqual(["done: Proposta enviada (05/11/2026)", `ended: ${last}`]);
		expect(result.ended).toBe(true);
		expect(result.nextStep).toBeNull();
	});
});

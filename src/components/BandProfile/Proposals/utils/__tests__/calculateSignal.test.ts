import { describe, expect, it } from "vitest";
import {
	PAYMENT_CONDITION,
	calculateSignal,
	downPaymentAmount,
	proposalDownPayment,
	requiresDownPayment,
} from "../calculateSignal";

// Rules agreed with the back-end (Cunha, 28/10/2026): only "Personalizado"
// sends the down payment; the other conditions let the back-end work it out
describe("calculateSignal", () => {
	const noDownPayment = { tipoSinalPagamento: null, valorSinalPagamento: null };

	it.each([
		["À vista no dia do evento", PAYMENT_CONDITION.ON_EVENT_DAY],
		["À vista antecipado", PAYMENT_CONDITION.FULL_UPFRONT],
		["50% antecipado", PAYMENT_CONDITION.SIGNAL_50],
		["30% antecipado", PAYMENT_CONDITION.SIGNAL_30],
	])("sends nothing for %s (the back-end calculates it)", (_, conditionId) => {
		expect(calculateSignal({ conditionId, customValue: 999 })).toEqual(
			noDownPayment
		);
	});

	it("sends the typed amount in reais (V) for Personalizado", () => {
		expect(
			calculateSignal({
				conditionId: PAYMENT_CONDITION.SIGNAL_CUSTOM,
				customValue: 1000,
			})
		).toEqual({ tipoSinalPagamento: "V", valorSinalPagamento: 1000 });
	});

	it("rounds the custom amount to cents", () => {
		expect(
			calculateSignal({
				conditionId: PAYMENT_CONDITION.SIGNAL_CUSTOM,
				customValue: 1000.005,
			}).valorSinalPagamento
		).toBe(1000.01);
	});
});

describe("requiresDownPayment", () => {
	it("is false only for 'À vista no dia do evento'", () => {
		expect(requiresDownPayment(PAYMENT_CONDITION.ON_EVENT_DAY)).toBe(false);
	});

	it.each([
		PAYMENT_CONDITION.FULL_UPFRONT,
		PAYMENT_CONDITION.SIGNAL_50,
		PAYMENT_CONDITION.SIGNAL_30,
		PAYMENT_CONDITION.SIGNAL_CUSTOM,
	])("is true for condition %i", (conditionId) => {
		expect(requiresDownPayment(conditionId)).toBe(true);
	});

	it("is false while no condition is chosen", () => {
		expect(requiresDownPayment(0)).toBe(false);
	});
});

describe("downPaymentAmount", () => {
	it("P is a percentage of the event value", () => {
		expect(
			downPaymentAmount({
				valor: 5000,
				tipoSinalPagamento: "P",
				valorSinalPagamento: 50,
			})
		).toBe(2500);
	});

	it("V is already the amount in reais", () => {
		expect(
			downPaymentAmount({
				valor: 5000,
				tipoSinalPagamento: "V",
				valorSinalPagamento: 1000,
			})
		).toBe(1000);
	});

	it("is unknown when the proposal doesn't say it", () => {
		expect(
			downPaymentAmount({
				valor: 5000,
				tipoSinalPagamento: null,
				valorSinalPagamento: null,
			})
		).toBeNull();
	});
});

describe("proposalDownPayment", () => {
	const proposal = (
		conditionId: number,
		tipo: string | null = null,
		valor: number | null = null
	) => ({
		valor: 5000,
		condicoesPagamento: { id: conditionId },
		tipoSinalPagamento: tipo,
		valorSinalPagamento: valor,
	});

	it("has no down payment for 'À vista no dia do evento'", () => {
		expect(proposalDownPayment(proposal(PAYMENT_CONDITION.ON_EVENT_DAY))).toBe(
			null
		);
	});

	it.each([
		["À vista antecipado", PAYMENT_CONDITION.FULL_UPFRONT, 5000],
		["50%", PAYMENT_CONDITION.SIGNAL_50, 2500],
		["30%", PAYMENT_CONDITION.SIGNAL_30, 1500],
	])(
		"uses the condition's percentage when the API doesn't send it (%s)",
		(_, conditionId, expected) => {
			expect(proposalDownPayment(proposal(conditionId))).toBe(expected);
		}
	);

	it("prefers what the API sends", () => {
		expect(
			proposalDownPayment(proposal(PAYMENT_CONDITION.SIGNAL_CUSTOM, "V", 1200))
		).toBe(1200);
	});
});

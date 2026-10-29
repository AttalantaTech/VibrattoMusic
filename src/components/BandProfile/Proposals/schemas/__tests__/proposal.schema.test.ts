import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createProposalSchema } from "../proposal.schema";
import { PAYMENT_CONDITION } from "../../utils/calculateSignal";

// A valid proposal for an event on 20/12/2026; each test changes one thing
const base = {
	idTipoEvento: 1,
	valor: 5000,
	local: "Teatro Municipal",
	dataEvento: "2026-12-20",
	horaInicio: "",
	duracao: null,
	tipoSinalPagamento: null,
	valorSinalPagamento: 0,
	formaPagamento: [1],
	idCondicoesPagamento: PAYMENT_CONDITION.SIGNAL_50,
	dataVencimentoAceite: 15,
	dataVencimentoSinalPagamento: 30,
};

/** Fields with an error, e.g. ["dataVencimentoSinalPagamento"] */
const errorsFor = (changes: Record<string, unknown>) => {
	const result = createProposalSchema.safeParse({ ...base, ...changes });
	return result.success
		? []
		: result.error.issues.map((issue) => issue.path.join("."));
};

describe("proposal form validation", () => {
	beforeAll(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-10-29T15:00:00-03:00"));
	});

	afterAll(() => {
		vi.useRealTimers();
	});

	it("accepts a complete proposal", () => {
		expect(errorsFor({})).toEqual([]);
	});

	describe("down payment due date", () => {
		it("is not required for 'À vista no dia do evento'", () => {
			expect(
				errorsFor({
					idCondicoesPagamento: PAYMENT_CONDITION.ON_EVENT_DAY,
					dataVencimentoSinalPagamento: Number.NaN,
				})
			).toEqual([]);
		});

		it.each([
			PAYMENT_CONDITION.FULL_UPFRONT,
			PAYMENT_CONDITION.SIGNAL_50,
			PAYMENT_CONDITION.SIGNAL_30,
		])("is required when the condition has a down payment (%i)", (id) => {
			expect(
				errorsFor({
					idCondicoesPagamento: id,
					dataVencimentoSinalPagamento: Number.NaN,
				})
			).toEqual(["dataVencimentoSinalPagamento"]);
		});

		it("can't end after the event", () => {
			expect(errorsFor({ dataVencimentoSinalPagamento: 90 })).toEqual([
				"dataVencimentoSinalPagamento",
			]);
		});
	});

	it("the acceptance deadline can't end after the event", () => {
		expect(errorsFor({ dataVencimentoAceite: 90 })).toEqual([
			"dataVencimentoAceite",
		]);
	});

	describe("Personalizado", () => {
		const custom = { idCondicoesPagamento: PAYMENT_CONDITION.SIGNAL_CUSTOM };

		it("requires the down payment amount", () => {
			expect(errorsFor({ ...custom, valorSinalPagamento: 0 })).toEqual([
				"valorSinalPagamento",
			]);
		});

		it("doesn't accept a down payment above the total", () => {
			expect(errorsFor({ ...custom, valorSinalPagamento: 6000 })).toEqual([
				"valorSinalPagamento",
			]);
		});

		it("accepts an amount within the total", () => {
			expect(errorsFor({ ...custom, valorSinalPagamento: 1000 })).toEqual([]);
		});
	});

	it("requires the event date", () => {
		expect(errorsFor({ dataEvento: "" })).toContain("dataEvento");
	});
});

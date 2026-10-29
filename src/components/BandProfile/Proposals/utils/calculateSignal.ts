export const PAYMENT_CONDITION = {
	ON_EVENT_DAY: 1,
	SIGNAL_50: 2,
	SIGNAL_30: 3,
	SIGNAL_CUSTOM: 4,
	FULL_UPFRONT: 5,
} as const;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Every condition except "À vista no dia do evento" has a down payment, so it
// needs a due date
export const requiresDownPayment = (conditionId: number) =>
	conditionId > 0 && conditionId !== PAYMENT_CONDITION.ON_EVENT_DAY;

// The back-end works out the down payment from the condition; only
// "Personalizado" sends the amount (in reais) the professional typed
export function calculateSignal({
	conditionId,
	customValue,
}: {
	conditionId: number;
	customValue: number;
}) {
	if (conditionId === PAYMENT_CONDITION.SIGNAL_CUSTOM) {
		return {
			tipoSinalPagamento: "V",
			valorSinalPagamento: round2(customValue),
		} as const;
	}

	return { tipoSinalPagamento: null, valorSinalPagamento: null } as const;
}

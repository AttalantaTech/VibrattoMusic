export const PAYMENT_CONDITION = {
	FULL_UPFRONT: 1,
	SIGNAL_50: 2,
	SIGNAL_30: 3,
	SIGNAL_CUSTOM: 4,
} as const;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calculateSignal({
	conditionId,
	total,
	customValue,
}: {
	conditionId: number;
	total: number;
	customValue: number;
}) {
	switch (conditionId) {
		case PAYMENT_CONDITION.FULL_UPFRONT:
			return {
				tipoSinalPagamento: "V",
				valorSinalPagamento: round2(total),
			} as const;
		case PAYMENT_CONDITION.SIGNAL_50:
			return {
				tipoSinalPagamento: "P",
				valorSinalPagamento: round2(total * 0.5),
			} as const;
		case PAYMENT_CONDITION.SIGNAL_30:
			return {
				tipoSinalPagamento: "P",
				valorSinalPagamento: round2(total * 0.3),
			} as const;
		case PAYMENT_CONDITION.SIGNAL_CUSTOM:
			return {
				tipoSinalPagamento: "V",
				valorSinalPagamento: round2(customValue),
			} as const;
		default:
			return { tipoSinalPagamento: null, valorSinalPagamento: null } as const;
	}
}

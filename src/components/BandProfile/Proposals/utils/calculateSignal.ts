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

/** The down payment in reais, or null when the proposal doesn't say it */
export const downPaymentAmount = ({
	valor,
	tipoSinalPagamento,
	valorSinalPagamento,
}: {
	valor: number;
	tipoSinalPagamento: string | null;
	valorSinalPagamento: number | null;
}) => {
	if (!valorSinalPagamento) return null;
	if (tipoSinalPagamento === "V") return round2(valorSinalPagamento);
	if (tipoSinalPagamento === "P")
		return round2((valor * valorSinalPagamento) / 100);
	return null;
};

// Share of the event value each fixed condition asks in advance
const CONDITION_PERCENT: Record<number, number> = {
	[PAYMENT_CONDITION.FULL_UPFRONT]: 100,
	[PAYMENT_CONDITION.SIGNAL_50]: 50,
	[PAYMENT_CONDITION.SIGNAL_30]: 30,
};

/** The proposal's down payment in reais; null when there is none or it's unknown */
export const proposalDownPayment = (proposal: {
	valor: number;
	condicoesPagamento: { id: number } | null;
	tipoSinalPagamento: string | null;
	valorSinalPagamento: number | null;
}) => {
	const conditionId = proposal.condicoesPagamento?.id ?? 0;
	if (!requiresDownPayment(conditionId)) return null;

	// The back-end fills tipo/valor for the fixed conditions too; if it
	// doesn't, the condition's own percentage gives the same amount
	const percent = CONDITION_PERCENT[conditionId];
	return (
		downPaymentAmount(proposal) ??
		(percent ? round2((proposal.valor * percent) / 100) : null)
	);
};

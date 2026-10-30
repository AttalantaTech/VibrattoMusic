import { useQueries } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import type { ProposalResponse, ScheduleApiResponse } from "@/api/types";
import { musicalProductService } from "@/api";
import { useFilteredProposals } from "@/hooks/useProposals";
import { musicalProductKeys } from "@/hooks/useMusicalProducts";

// Accepted proposals (signing, waiting for the down payment or already paid):
// the date is promised, but the agenda is only blocked when the professional
// saves the event
export const PRE_RESERVATION_STATUSES = [
	"Aceita",
	"AguardandoPagamento",
	"ContratacaoConcluida",
];

export type PreReservation = {
	proposal: ProposalResponse;
	/** Event day, yyyy-MM-dd */
	date: string;
	/** Who hired, for the calendar and the notice */
	client: string;
};

const day = (date: string) => date.slice(0, 10);

export const proposalClient = (proposal: ProposalResponse) =>
	proposal.produtoMusicalContratante?.nome ||
	proposal.contratante?.nome ||
	proposal.nomeContratante ||
	"Contratante";

/**
 * Accepted proposals whose day isn't blocked in the agenda yet. A day counts
 * as reserved once it is "Ocupado" (an event that doesn't allow others)
 */
export const pendingPreReservations = (
	proposals: Array<ProposalResponse>,
	schedule: Array<ScheduleApiResponse>,
	today: string
): Array<PreReservation> => {
	const blocked = new Set(
		schedule.filter((s) => s.status === "Ocupado").map((s) => day(s.data))
	);

	return proposals
		.filter((p) => PRE_RESERVATION_STATUSES.includes(p.status.nome))
		.map((p) => ({
			proposal: p,
			date: day(p.dataInicio),
			client: proposalClient(p),
		}))
		.filter((r) => r.date >= today && !blocked.has(r.date))
		.sort((a, b) => a.date.localeCompare(b.date));
};

/** The professional's dates promised by accepted proposals, not yet blocked */
export const usePreReservations = (productId: number | undefined) => {
	const enabled = !!productId;
	const today = format(new Date(), "yyyy-MM-dd");

	const { data: proposals } = useFilteredProposals({
		IdProdutoMusical: productId ?? null,
		status: PRE_RESERVATION_STATUSES,
		enabled,
	});

	const upcoming = (proposals?.data ?? []).filter(
		(p) => day(p.dataInicio) >= today
	);

	// One request per month with a booked event: the API refuses ranges longer
	// than a month ("ValidacaoInvalida"), which hid every notice. Under the
	// schedule key, so saving an event refreshes them
	const months = [
		...new Set(upcoming.map((p) => day(p.dataInicio).slice(0, 7))),
	];
	const schedules = useQueries({
		queries: months.map((month) => ({
			queryKey: [
				...musicalProductKeys.saveSchedule(),
				"month",
				productId,
				month,
			],
			queryFn: () =>
				musicalProductService.getSchedule(
					productId ?? 0,
					parseISO(`${month}-01`)
				),
			enabled,
			staleTime: 60 * 1000,
		})),
	});

	if (!enabled || schedules.some((query) => query.isPending)) return [];

	// A month that failed to load counts as not blocked: better to remind the
	// professional once too often than to hide a date that is still open
	const schedule = schedules.flatMap((query) => query.data ?? []);
	return pendingPreReservations(upcoming, schedule, today);
};

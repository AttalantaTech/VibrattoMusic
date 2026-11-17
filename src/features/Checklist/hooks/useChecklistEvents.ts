import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { addMonths, format, parseISO, startOfMonth } from "date-fns";
import { musicalProductService } from "@/api";
import { useFilteredProposals } from "@/hooks/useProposals";
import { musicalProductKeys } from "@/hooks/useMusicalProducts";
import { buildEvents, HIRED_STATUSES } from "../utils/buildChecklist";

/** Agenda months always read, for events outside the platform (this + 2) */
const AGENDA_MONTHS = 3;

/**
 * The profile's events: hired proposals and the agenda's commitments. The
 * agenda API refuses ranges longer than a month, so one request per month
 */
export const useChecklistEvents = (profileId: number | undefined) => {
	const enabled = !!profileId;

	const proposals = useFilteredProposals({
		IdProdutoMusical: profileId ?? null,
		status: HIRED_STATUSES,
		enabled,
	});

	const proposalList = proposals.data?.data;

	// The next months, plus the month of every hired event further ahead:
	// without its month, a hired day saved in the agenda looked unsaved
	const months = useMemo(() => {
		const first = startOfMonth(new Date());
		const keys = new Set(
			Array.from({ length: AGENDA_MONTHS }, (_, index) =>
				format(addMonths(first, index), "yyyy-MM")
			)
		);
		const thisMonth = format(first, "yyyy-MM");
		for (const proposal of proposalList ?? []) {
			const month = proposal.dataInicio.slice(0, 7);
			if (month >= thisMonth) keys.add(month);
		}
		return [...keys].sort();
	}, [proposalList]);

	const schedules = useQueries({
		queries: months.map((month) => ({
			queryKey: [
				...musicalProductKeys.saveSchedule(),
				"month",
				profileId,
				month,
			],
			queryFn: () =>
				musicalProductService.getSchedule(
					profileId ?? 0,
					parseISO(`${month}-01`)
				),
			enabled,
			staleTime: 60 * 1000,
		})),
	});

	const isLoading =
		proposals.isLoading || schedules.some((query) => query.isLoading);
	const scheduleData = schedules.map((query) => query.data);

	const events = useMemo(
		() =>
			buildEvents(
				proposalList ?? [],
				scheduleData.flatMap((month) => month ?? [])
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[proposalList, ...scheduleData]
	);

	return { events, isLoading };
};

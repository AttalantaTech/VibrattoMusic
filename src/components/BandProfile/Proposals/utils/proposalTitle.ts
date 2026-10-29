import { format, parseISO } from "date-fns";
import type { ProposalResponse } from "@/api/types";

/**
 * How a proposal is named in Vendas/Contratações: "Casamento · 20/12/2026".
 * It used to be the description, the same standard text for every proposal.
 */
export const proposalTitle = (
	proposal: Pick<ProposalResponse, "id" | "tipoEvento" | "dataInicio">
): string => {
	const eventType = proposal.tipoEvento?.nome || `Proposta #${proposal.id}`;
	// Day only: a bare date would shift a day back in UTC-3
	const day = proposal.dataInicio
		? format(parseISO(proposal.dataInicio.slice(0, 10)), "dd/MM/yyyy")
		: null;

	return day ? `${eventType} · ${day}` : eventType;
};

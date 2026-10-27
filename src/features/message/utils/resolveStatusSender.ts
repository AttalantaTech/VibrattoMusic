import type { ChatRecipient } from "@/api/services/messages/types";
import type { ProposalResponse } from "@/api/types";

/**
 * Who is performing the action on the proposal:
 * - "contratado": the musical product that received/sent the proposal (band side)
 * - "contratante": whoever hired (a user OR a contractor musical product)
 */
export type ProposalExecutor = "contratante" | "contratado";

export interface ProposalParties {
	produtoMusicalId: number;
	contratanteId: number | null;
	produtoMusicalContratanteId: number | null;
}

export interface StatusSender extends ProposalParties {
	/** 1 = user (contratante) | 2 = musical product */
	senderType: 1 | 2;
	/**
	 * Who we are talking to. Decides the single id sent to
	 * chat/obter and chat/mensagem (the sender comes from the token).
	 */
	recipient: ChatRecipient;
}

export const proposalParties = (
	proposal: ProposalResponse
): ProposalParties => ({
	produtoMusicalId: proposal.produtoMusical.id,
	contratanteId: proposal.contratante.id > 0 ? proposal.contratante.id : null,
	produtoMusicalContratanteId:
		proposal.produtoMusicalContratante.id > 0
			? proposal.produtoMusicalContratante.id
			: null,
});

export const resolveStatusSender = (
	parties: ProposalParties,
	executor: ProposalExecutor
): StatusSender => {
	if (executor === "contratado") {
		// The band acts and talks to the contratante side
		return {
			...parties,
			senderType: 1,
			recipient: parties.produtoMusicalContratanteId
				? "produtoContratante"
				: "contratante",
		};
	}

	// The contratante side acts and talks to the hired musical product
	return {
		...parties,
		senderType: parties.contratanteId ? 1 : 2,
		recipient: "produtoMusical",
	};
};

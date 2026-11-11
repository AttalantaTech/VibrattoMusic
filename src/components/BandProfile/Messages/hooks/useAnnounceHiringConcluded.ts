import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { proposalService } from "@/api/services/proposalService";
import { PROPOSAL_QUERY_KEYS } from "@/hooks/useProposals";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { entityLinks } from "@/features/message/utils/messageTemplates";
import {
	markConclusionAnnounced,
	proposalsAwaitingConclusionCard,
	wasConclusionAnnounced,
} from "@/features/message/utils/hiringConcluded";
import {
	proposalParties,
	resolveStatusSender,
} from "@/features/message/utils/resolveStatusSender";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

// Waits for the conversation to settle: the conclusion card may be arriving
// right behind the down payment one, sent by the other side
const SETTLE_TIME = 4000;

/**
 * Sends the "Contratação concluída" card when the open conversation follows a
 * proposal that was concluded with no card telling it (the back-end concludes
 * it on the last signature, with nobody on a screen). Only the hired side
 * sends it, once: the same side that sends it when the down payment is the
 * last step, so the contractor is the one notified and the two sides never
 * send it at the same time
 */
export const useAnnounceHiringConcluded = ({
	conversationId,
	messages,
	isLoading,
}: {
	conversationId: number | undefined;
	messages: Array<{ conteudo: string; idConversa: number }> | undefined;
	isLoading: boolean | undefined;
}) => {
	const queryClient = useQueryClient();
	const { sendStatusMessage } = useSendStatusMessage();
	const activeProductId = useMusicalProductStore(
		(state) => state.activeProduct?.id
	);

	useEffect(() => {
		if (!conversationId || isLoading || !messages?.length) return;
		// While it loads, the messages are still the previous conversation's
		if (messages[0]?.idConversa !== conversationId) return;

		const pending = proposalsAwaitingConclusionCard(messages).filter(
			(id) => !wasConclusionAnnounced(id)
		);
		if (pending.length === 0) return;

		let canceled = false;
		const timer = window.setTimeout(() => {
			void (async () => {
				const proposals = await Promise.all(
					pending.map((id) =>
						queryClient
							.fetchQuery({
								queryKey: [...PROPOSAL_QUERY_KEYS.all, "concluded-check", id],
								queryFn: () =>
									proposalService.listProposals({
										Id: id,
										incluirSubstituidas: true,
									}),
								staleTime: 60_000,
							})
							.then(([proposal]) => proposal)
							// Not found or no access: nothing to announce
							.catch(() => undefined)
					)
				);
				if (canceled) return;

				for (const proposal of proposals) {
					if (proposal?.status.nome !== "ContratacaoConcluida") continue;
					if (wasConclusionAnnounced(proposal.id)) continue;

					const isHired =
						!!activeProductId && proposal.produtoMusical.id === activeProductId;
					if (!isHired) continue;

					markConclusionAnnounced(proposal.id);
					sendStatusMessage({
						type: "hiringConcluded",
						...resolveStatusSender(proposalParties(proposal), "contratado"),
						conversationId,
						produtoMusicalName: proposal.produtoMusical.nome,
						link: entityLinks.hiringProgress(proposal.id),
						errorMessage: "Erro ao avisar a conclusão da contratação",
						payload: { downPayment: !!proposal.sinalPago },
					});
				}
			})();
		}, SETTLE_TIME);

		return () => {
			canceled = true;
			window.clearTimeout(timer);
		};
		// sendStatusMessage is recreated on every render
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [conversationId, isLoading, messages, activeProductId, queryClient]);
};

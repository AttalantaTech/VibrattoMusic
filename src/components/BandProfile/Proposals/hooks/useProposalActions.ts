import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { ProposalResponse } from "@/api/types";
import {
	PROPOSAL_QUERY_KEYS,
	useUpdateProposalStatus,
} from "@/hooks/useProposals";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { entityLinks } from "@/features/message/utils/messageTemplates";
import {
	proposalParties,
	resolveStatusSender,
} from "@/features/message/utils/resolveStatusSender";
import { showApiError } from "@/utils/showApiError";

/**
 * Accept, cancel and confirm the down payment of a proposal, notifying the
 * other side in the chat. Shared by Vendas, Contratações and the chat so the
 * three behave the same. The conversation id is optional: without it,
 * chat/obter finds the conversation from the proposal's parties.
 */
export const useProposalActions = (conversationId?: number | null) => {
	const queryClient = useQueryClient();
	const updateStatusMutation = useUpdateProposalStatus();
	const { sendStatusMessage } = useSendStatusMessage();

	const [isLoadingAccept, setIsLoadingAccept] = useState(false);
	const [isLoadingCancel, setIsLoadingCancel] = useState(false);
	const [isLoadingPaidSign, setIsLoadingPaidSign] = useState(false);

	// Also refreshes a proposal opened by number (chat) or by its link
	const refreshProposals = () => {
		void queryClient.invalidateQueries({ queryKey: PROPOSAL_QUERY_KEYS.all });
	};

	const accept = async (proposal: ProposalResponse) => {
		try {
			setIsLoadingAccept(true);
			await updateStatusMutation.mutateAsync({
				proposalId: proposal.id,
				status: "aceito",
			});
			refreshProposals();

			sendStatusMessage({
				type: "proposalAccepted",
				...resolveStatusSender(proposalParties(proposal), "contratante"),
				conversationId,
				produtoMusicalName: proposal.produtoMusical.nome,
				link: entityLinks.proposalTab(proposal.id),
				errorMessage: "Erro ao enviar solicitação orçamento",
				payload: {},
			});
		} catch (error) {
			showApiError(
				error,
				"Erro ao tentar aceitar a proposta. Tente novamente."
			);
		} finally {
			setIsLoadingAccept(false);
		}
	};

	const cancel = async (proposal: ProposalResponse) => {
		try {
			setIsLoadingCancel(true);
			await updateStatusMutation.mutateAsync({
				proposalId: proposal.id,
				status: "cancelado",
			});
			refreshProposals();

			sendStatusMessage({
				type: "proposalCanceled",
				...resolveStatusSender(proposalParties(proposal), "contratado"),
				conversationId,
				produtoMusicalName: proposal.produtoMusical.nome,
				link: entityLinks.proposalTab(proposal.id),
				errorMessage: "Erro ao enviar requisição",
				payload: {},
			});
		} catch (error) {
			showApiError(error, "Error updating proposal status:");
		} finally {
			setIsLoadingCancel(false);
		}
	};

	/** Returns whether it worked, so the confirmation dialog can close */
	const confirmPaidSign = async (proposal: ProposalResponse) => {
		try {
			setIsLoadingPaidSign(true);
			await updateStatusMutation.mutateAsync({
				proposalId: proposal.id,
				status: "sinalPago",
			});
			refreshProposals();

			sendStatusMessage({
				type: "proposalPaidSign",
				...resolveStatusSender(proposalParties(proposal), "contratado"),
				conversationId,
				produtoMusicalName: proposal.produtoMusical.nome,
				link: entityLinks.proposalTab(proposal.id),
				errorMessage: "Erro ao enviar sua requisição",
				payload: {},
			});
			return true;
		} catch (error) {
			showApiError(error, "Erro ao confirmar o sinal. Tente novamente.");
			return false;
		} finally {
			setIsLoadingPaidSign(false);
		}
	};

	return {
		accept,
		cancel,
		confirmPaidSign,
		isLoadingAccept,
		isLoadingCancel,
		isLoadingPaidSign,
	};
};

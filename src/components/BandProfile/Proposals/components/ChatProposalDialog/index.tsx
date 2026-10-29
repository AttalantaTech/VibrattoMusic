import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ProposalResponse } from "@/api/types";
import { useProposalByNumber } from "@/hooks/useProposals";
import { ProposalDetailsModal } from "../ProposalDetailsModal";
import { ProposalRejectionModal } from "../ProposalRejectionModal";
import { ConfirmDownPaymentDialog } from "../ConfirmDownPaymentDialog";
import { useProposalActions } from "../../hooks/useProposalActions";

interface ChatProposalDialogProps {
	/** Proposal number from the chat link; null keeps it closed */
	proposalId: number | null;
	/** The band (seller) gets the Vendas actions, the contractor Contratações' */
	isSeller: boolean;
	conversationId?: number | null;
	onClose: () => void;
}

// "Ver proposta" in the chat: the same details dialog as Vendas/Contratações,
// actions included, over the conversation
export const ChatProposalDialog = ({
	proposalId,
	isSeller,
	conversationId,
	onClose,
}: ChatProposalDialogProps) => {
	const navigate = useNavigate();
	const { data: proposal, isError } = useProposalByNumber(proposalId);
	const {
		accept,
		cancel,
		confirmPaidSign,
		isLoadingAccept,
		isLoadingCancel,
		isLoadingPaidSign,
	} = useProposalActions(conversationId);

	const [proposalToReject, setProposalToReject] =
		useState<ProposalResponse | null>(null);
	const [proposalToConfirmPayment, setProposalToConfirmPayment] =
		useState<ProposalResponse | null>(null);

	useEffect(() => {
		if (!isError) return;
		toast.error("Não foi possível abrir esta proposta.");
		onClose();
	}, [isError, onClose]);

	return (
		<>
			<ProposalDetailsModal
				isOpen={!!proposalId && !!proposal}
				mode={isSeller ? "Contracted" : "Contractor"}
				proposal={proposal ?? null}
				onClose={onClose}
				onAccept={async () => {
					if (proposal) await accept(proposal);
				}}
				onReject={setProposalToReject}
				onCancel={async () => {
					if (proposal) await cancel(proposal);
				}}
				// Asks first; the dialog closes and the confirmation takes over
				onPaidSign={() => {
					setProposalToConfirmPayment(proposal ?? null);
					return Promise.resolve();
				}}
				onSeeContract={(identificadorUnico) => {
					void navigate({
						to: "/band/contract/$id",
						params: { id: identificadorUnico },
					});
				}}
				isLoadingAccept={isLoadingAccept}
				isLoadingCancel={isLoadingCancel}
				isLoadingPaidSign={isLoadingPaidSign}
			/>

			<ProposalRejectionModal
				isOpen={!!proposalToReject}
				onClose={() => {
					setProposalToReject(null);
				}}
				proposal={proposalToReject}
			/>

			<ConfirmDownPaymentDialog
				proposal={proposalToConfirmPayment}
				isLoading={isLoadingPaidSign}
				onConfirm={async (confirmed) => {
					if (await confirmPaidSign(confirmed)) {
						setProposalToConfirmPayment(null);
					}
				}}
				onClose={() => {
					setProposalToConfirmPayment(null);
				}}
			/>
		</>
	);
};

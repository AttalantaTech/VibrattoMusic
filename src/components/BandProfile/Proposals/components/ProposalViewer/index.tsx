import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ProposalResponse } from "@/api/types";
import { useProposalByNumber } from "@/hooks/useProposals";
import { ProposalDetailsModal } from "../ProposalDetailsModal";
import { ProposalRejectionModal } from "../ProposalRejectionModal";
import { ConfirmDownPaymentDialog } from "../ConfirmDownPaymentDialog";
import { HiringProgressModal } from "../HiringProgressModal";
import { ContractDetailsModal } from "../ContractDetailsModal";
import { ProposalViewTabs, type ProposalView } from "../ProposalViewTabs";
import { useProposalActions } from "../../hooks/useProposalActions";

interface ProposalViewerProps {
	/** Proposal number; null keeps it closed */
	proposalId: number | null;
	/** Which dialog it opens on */
	initialView?: ProposalView;
	/** The band (seller) gets the Vendas actions, the contractor Contratações' */
	isSeller: boolean;
	conversationId?: number | null;
	onClose: () => void;
}

// The contract exists from the acceptance on
const HAS_CONTRACT = new Set([
	"Aceita",
	"AguardandoPagamento",
	"ContratacaoConcluida",
]);

/**
 * The proposal's progress, details and contract over the current screen (chat,
 * Vendas, Contratações), with tabs between the three and their actions.
 * Closing it leaves the user where they were; the contract used to be a page
 * of its own, and coming back closed the conversation. The proposal is read
 * again when opened, so it shows what changed meanwhile (e.g. signatures)
 */
export const ProposalViewer = ({
	proposalId,
	initialView = "details",
	isSeller,
	conversationId,
	onClose,
}: ProposalViewerProps) => {
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

	const [view, setView] = useState<ProposalView>(initialView);
	useEffect(() => {
		setView(initialView);
	}, [proposalId, initialView]);

	useEffect(() => {
		if (!isError) return;
		toast.error("Não foi possível abrir esta proposta.");
		onClose();
	}, [isError, onClose]);

	const isOpen = !!proposalId && !!proposal;
	const hasContract = HAS_CONTRACT.has(proposal?.status.nome ?? "");
	// No contract yet (e.g. opened by an old link): the proposal instead
	const shownView = view === "contract" && !hasContract ? "details" : view;

	const navigation = (
		<ProposalViewTabs
			view={shownView}
			hasContract={hasContract}
			onChange={setView}
		/>
	);

	// The confirmation takes over: the dialog closes behind it
	const askDownPaymentConfirmation = (toConfirm: ProposalResponse | null) => {
		setProposalToConfirmPayment(toConfirm);
		onClose();
	};

	return (
		<>
			<HiringProgressModal
				proposal={isOpen && shownView === "progress" ? proposal : null}
				isSeller={isSeller}
				onClose={onClose}
				navigation={navigation}
				onConfirmDownPayment={askDownPaymentConfirmation}
			/>

			<ProposalDetailsModal
				isOpen={isOpen && shownView === "details"}
				mode={isSeller ? "Contracted" : "Contractor"}
				proposal={proposal ?? null}
				navigation={navigation}
				onClose={onClose}
				onAccept={async () => {
					if (proposal) await accept(proposal);
				}}
				onReject={setProposalToReject}
				onCancel={async () => {
					if (proposal) await cancel(proposal);
				}}
				onPaidSign={() => {
					askDownPaymentConfirmation(proposal ?? null);
					return Promise.resolve();
				}}
				onSeeContract={() => {
					setView("contract");
				}}
				isLoadingAccept={isLoadingAccept}
				isLoadingCancel={isLoadingCancel}
				isLoadingPaidSign={isLoadingPaidSign}
			/>

			<ContractDetailsModal
				proposal={isOpen && shownView === "contract" ? proposal : null}
				isSeller={isSeller}
				navigation={navigation}
				onClose={onClose}
				onCancel={cancel}
				onPaidSign={askDownPaymentConfirmation}
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

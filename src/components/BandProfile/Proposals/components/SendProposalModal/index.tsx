import { Button } from "../../../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../../ui/dialog";

import { useCreateProposal } from "../../../../../hooks/useProposals";
import type { ProposalResponse } from "../../../../../api/types";

import { ProfileIncompleteModal } from "../../../../ui/ProfileIncompleteModal/ProfileIncompleteModal";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

import { useProposalForm } from "../../hooks/useProposalForm";
import { useProposalSubmit } from "../../hooks/useProposalSubmit";
import { useProposalState } from "../../hooks/useProposalState";
import { ProposalFormFields } from "../ProposalFormFields";

interface SendProposalModalProps {
	isOpen: boolean;
	onClose: () => void;
	recipientId?: number; // Proposal recipient ID (optional for context)
	contractorId?: number;
	contractorName?: string;
	conversationId?: number; // Conversation ID for sending a message
	onProposalSent?: (proposalDetails: string) => Promise<void>; // Callback to send a message after the proposal
	proposal?: ProposalResponse | null;
}

export const SendProposalModal = ({
	isOpen,
	onClose,
	contractorId,
	contractorName,
	conversationId,
	onProposalSent,
	proposal,
}: SendProposalModalProps) => {
	// Use the currently active musical product
	const { activeProduct } = useMusicalProductStore();
	const userProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	const createProposalMutation = useCreateProposal();

	const {
		eventTypes,
		paymentMethods,
		paymentConditions,
		showProfileIncompleteModal,
		setShowProfileIncompleteModal,
		expandedSections,
		setExpandedSections,
		selectedPaymentMethods,
		setSelectedPaymentMethods,
		hasDefineEventTime,
		setHasDefineEventTime,
	} = useProposalState(proposal || null);

	const {
		form,
		handleHasDefineEventTime,
		setQuickDuration,
		isSectionComplete,
	} = useProposalForm({
		proposal,
		contractorId,
		contractorName,
		setHasDefineEventTime,
	});
	const { handleSubmit } = form;

	const handleClose = () => {
		onClose();
		setHasDefineEventTime(false);
		setSelectedPaymentMethods([]);
	};

	const { onSubmit } = useProposalSubmit({
		eventTypes,
		handleClose,
		paymentConditions,
		paymentMethods,
		proposal,
		setShowProfileIncompleteModal,
		contractorId,
		conversationId,
		onProposalSent,
		userProductId,
		hasDefineEventTime,
	});

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((previous) => ({
			...previous,
			[section]: !previous[section],
		}));
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose();
			}}
		>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<form onSubmit={handleSubmit(onSubmit)}>
					<DialogHeader>
						<DialogTitle>
							{proposal ? "Editar Proposta" : "Criar Nova Proposta"}
						</DialogTitle>
						<DialogDescription>
							{proposal
								? "Edite com facilidade os campos da proposta"
								: "Configure todos os campos necessários para criar a proposta"}
						</DialogDescription>
					</DialogHeader>

					<ProposalFormFields
						form={form}
						handleHasDefineEventTime={handleHasDefineEventTime}
						isSectionComplete={isSectionComplete}
						setQuickDuration={setQuickDuration}
						toggleSection={toggleSection}
						expandedSections={expandedSections}
						hasDefineEventTime={hasDefineEventTime}
						paymentMethods={paymentMethods}
						paymentConditions={paymentConditions}
						selectedPaymentMethods={selectedPaymentMethods}
						setSelectedPaymentMethods={setSelectedPaymentMethods}
						eventTypes={eventTypes}
					/>

					<DialogFooter className="gap-2">
						<Button type="button" variant="secondary" onClick={handleClose}>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={createProposalMutation.isPending || !userProductId}
							className="bg-primary-600 hover:bg-primary-700"
						>
							{createProposalMutation.isPending
								? "Enviando..."
								: !userProductId
									? "Sem produto musical"
									: proposal
										? "Salvar"
										: "Enviar Proposta"}
						</Button>
					</DialogFooter>
				</form>

				{/* Profile Incomplete Modal */}
				<ProfileIncompleteModal
					isOpen={showProfileIncompleteModal}
					onClose={() => {
						setShowProfileIncompleteModal(false);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};

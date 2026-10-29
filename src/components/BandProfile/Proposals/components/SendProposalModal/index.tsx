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
	contractorId?: number;
	contractorProductId?: number | null;
	contractorName?: string;
	conversationId?: number; // Conversation ID for sending a message
	proposal?: ProposalResponse | null;
	// Rejected proposal to answer: prefills the form and sends a new proposal
	counterProposalOf?: ProposalResponse | null;
}

export const SendProposalModal = ({
	isOpen,
	onClose,
	contractorId,
	contractorProductId,
	contractorName,
	conversationId,
	proposal,
	counterProposalOf,
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
	} = useProposalState(proposal || counterProposalOf || null);

	const {
		form,
		handleHasDefineEventTime,
		setQuickDuration,
		isSectionComplete,
	} = useProposalForm({
		proposal,
		counterProposalOf,
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
		counterProposalOf,
		setShowProfileIncompleteModal,
		contractorId,
		contractorProductId,
		conversationId,
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
							{proposal
								? "Editar Proposta"
								: counterProposalOf
									? "Fazer Contraproposta"
									: "Criar Nova Proposta"}
						</DialogTitle>
						<DialogDescription>
							{proposal
								? "Edite com facilidade os campos da proposta"
								: counterProposalOf
									? "Os campos vêm da proposta rejeitada: altere o que o cliente pediu e envie"
									: "Configure todos os campos necessários para criar a proposta"}
						</DialogDescription>
					</DialogHeader>
					{counterProposalOf?.motivoRejeicao ? (
						<p className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
							<span className="font-medium">Motivo da rejeição:</span>{" "}
							{counterProposalOf.motivoRejeicao.nome}
						</p>
					) : null}
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

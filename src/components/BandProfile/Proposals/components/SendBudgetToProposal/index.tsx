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
import { ProfileIncompleteModal } from "../../../../ui/ProfileIncompleteModal/ProfileIncompleteModal";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useBudgetState } from "../../hooks/useBudgetState";
import { useBudgetForm } from "../../hooks/useBudgetForm";
import { useBudgetSubmit } from "../../hooks/useBudgetSubmit";
import type { CreateProposalForm } from "../../schemas/proposal.schema";
import { ProposalFormFields } from "../ProposalFormFields";

interface SendBudgetToProposalProps {
	isOpen: boolean;
	onClose: () => void;
	recipientId?: number; // Proposal recipient ID (optional for context)
	contractorId?: number;
	contractorName?: string;
	conversationId?: number; // Conversation ID for sending a message
	onBudgetSent?: (budgetDetails: string) => Promise<void>; // Callback to send a message after the proposal
	budget?: CreateProposalForm;
}

export const SendBudgetToProposal = ({
	isOpen,
	onClose,
	contractorId,
	contractorName,
	conversationId,
	onBudgetSent,
	budget,
}: SendBudgetToProposalProps) => {
	// Use the currently active musical product
	const { activeProduct } = useMusicalProductStore();
	const userProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	const createProposalMutation = useCreateProposal();

	const {
		eventTypes,
		showProfileIncompleteModal,
		setShowProfileIncompleteModal,
		expandedSections,
		setExpandedSections,
		selectedPaymentMethods,
		setSelectedPaymentMethods,
		hasDefineEventTime,
		setHasDefineEventTime,
		paymentConditions,
		paymentMethods,
	} = useBudgetState(budget || null);

	const {
		form,
		setQuickDuration,
		handleHasDefineEventTime,
		isSectionComplete,
	} = useBudgetForm({
		budget,
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

	const { onSubmit } = useBudgetSubmit({
		eventTypes,
		handleClose,
		paymentConditions,
		paymentMethods,
		budget,
		setShowProfileIncompleteModal,
		contractorId,
		conversationId,
		onBudgetSent,
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
						<DialogTitle>Criar Nova Proposta</DialogTitle>
						<DialogDescription>
							Configure todos os campos necessários para criar a proposta
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

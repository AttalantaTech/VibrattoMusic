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
import { useBudgetState } from "../../hooks/useBudgetState";
import { useBudgetForm } from "../../hooks/useBudgetForm";
import { useBudgetSubmit } from "../../hooks/useBudgetSubmit";
import type { CreateProposalForm } from "../../schemas/proposal.schema";
import { ProposalFormFields } from "../ProposalFormFields";

interface SendBudgetToProposalProps {
	isOpen: boolean;
	onClose: () => void;
	contractorId: number;
	musicalProductId: number | null;
	musicalProductContractorId: number | null;
	conversationId?: number;
	budget?: CreateProposalForm;
}

export const SendBudgetToProposal = ({
	isOpen,
	onClose,
	contractorId,
	conversationId,
	musicalProductContractorId,
	musicalProductId,
	budget,
}: SendBudgetToProposalProps) => {
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
		standardDescription,
	} = useBudgetForm({
		budget,
		contractorId,
		setHasDefineEventTime,
	});
	const { handleSubmit } = form;

	const handleClose = () => {
		onClose();
		setHasDefineEventTime(false);
		setSelectedPaymentMethods([]);
	};

	const { onSubmit } = useBudgetSubmit({
		handleClose,
		contractorId,
		conversationId,
		musicalProductId,
		hasDefineEventTime,
		musicalProductContractorId,
		setShowProfileIncompleteModal,
		eventTypes,
		standardDescription,
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
						standardDescription={standardDescription}
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
							Cancela
						</Button>
						<Button
							type="submit"
							disabled={createProposalMutation.isPending || !musicalProductId}
							className="bg-primary-600 hover:bg-primary-700"
						>
							{createProposalMutation.isPending
								? "Enviando..."
								: !musicalProductId
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

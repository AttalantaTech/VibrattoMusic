import { DollarSign, Loader2 } from "lucide-react";
import type { ProposalResponse } from "@/api/types";
import { Button } from "@/components/ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { handleCurrencyFormatting } from "@/utils";
import { downPaymentAmount } from "../../utils/calculateSignal";

interface ConfirmDownPaymentDialogProps {
	proposal: ProposalResponse | null;
	isLoading?: boolean;
	onConfirm: (proposal: ProposalResponse) => Promise<void>;
	onClose: () => void;
}

// Confirming changes the status and notifies the client, so it asks first
export const ConfirmDownPaymentDialog = ({
	proposal,
	isLoading = false,
	onConfirm,
	onClose,
}: ConfirmDownPaymentDialogProps) => {
	const amount = proposal ? downPaymentAmount(proposal) : null;
	const clientName =
		proposal?.contratante.nome || proposal?.nomeContratante || "o cliente";

	return (
		<Dialog
			open={!!proposal}
			onOpenChange={(open) => {
				if (!open && !isLoading) onClose();
			}}
		>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Confirmar Recebimento do Sinal</DialogTitle>
					<DialogDescription>
						Confirma que recebeu o sinal
						{amount ? ` de R$ ${handleCurrencyFormatting(amount)}` : ""} de{" "}
						<span className="font-semibold text-gray-900">{clientName}</span>?
						Ao confirmar, a contratação será concluída e o cliente será avisado.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="gap-2">
					<Button variant="secondary" disabled={isLoading} onClick={onClose}>
						Voltar
					</Button>
					<Button
						className="bg-green-600 hover:bg-green-700 border-green-600 disabled:hover:bg-green-600 disabled:opacity-50"
						disabled={isLoading || !proposal}
						onClick={async () => {
							if (proposal) await onConfirm(proposal);
						}}
					>
						{isLoading ? (
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
						) : (
							<DollarSign className="h-4 w-4 mr-2" />
						)}
						Confirmar Recebimento
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

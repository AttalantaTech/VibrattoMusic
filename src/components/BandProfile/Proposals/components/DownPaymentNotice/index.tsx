import { AlertCircle } from "lucide-react";
import type { ProposalResponse } from "@/api/types";
import { handleCurrencyFormatting } from "@/utils";
import { format, parseISO } from "date-fns";
import {
	proposalDownPayment,
	requiresDownPayment,
} from "../../utils/calculateSignal";

interface DownPaymentNoticeProps {
	proposal: ProposalResponse;
}

// Tells the contractor how much to pay and until when, from the acceptance
// until the professional confirms the payment. Hidden when the condition has
// no down payment or it's already paid (Contratação Concluída)
export const DownPaymentNotice = ({ proposal }: DownPaymentNoticeProps) => {
	const status = proposal.status.nome;
	const isSigning = status === "Aceita";

	if (
		(!isSigning && status !== "AguardandoPagamento") ||
		!requiresDownPayment(proposal.condicoesPagamento?.id ?? 0)
	) {
		return null;
	}

	const amount = proposalDownPayment(proposal);
	const dueDate = proposal.dataVencimentoSinalPagamento;

	return (
		<div className="my-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
			<div className="flex gap-3">
				<AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
				<div className="text-sm text-primary-800">
					<p className="font-medium mb-2">Pagamento do sinal:</p>
					<span className="block mb-4">
						{isSigning
							? "Depois que o contrato for assinado pelas duas partes, efetue o pagamento do sinal"
							: "Efetue o pagamento do sinal"}
						{amount ? (
							<>
								{" "}
								de{" "}
								<span className="font-semibold">
									R$ {handleCurrencyFormatting(amount)}
								</span>
							</>
						) : null}
						{dueDate ? (
							<>
								{" "}
								até{" "}
								<span className="font-semibold">
									{/* Day only: a bare date would shift a day back in UTC-3 */}
									{format(parseISO(dueDate.slice(0, 10)), "dd/MM/yyyy")}
								</span>
							</>
						) : null}{" "}
						e aguarde{" "}
						<span className="font-semibold">
							{proposal.produtoMusical.nome}
						</span>{" "}
						confirmar o recebimento na plataforma. Após a confirmação, você
						receberá um email confirmando a contratação para o seu evento.
					</span>
				</div>
			</div>
		</div>
	);
};

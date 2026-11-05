import {
	Ban,
	CheckCircle2,
	Clock,
	DollarSign,
	Eye,
	PenLine,
} from "lucide-react";
import type { ProposalResponse } from "@/api/types";
import { Button } from "@/components/ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { day, hiringSteps, type StepState } from "../../utils/hiringSteps";
import { awaitsDownPayment } from "../../utils/proposalRoles";

interface HiringProgressModalProps {
	proposal: ProposalResponse | null;
	/** The band (seller) can confirm the down payment from here */
	isSeller: boolean;
	onClose: () => void;
	onSeeProposal: () => void;
	onSeeContract: (identificadorUnico: string) => void;
	onConfirmDownPayment: (proposal: ProposalResponse) => void;
}

const STEP_ICONS: Record<StepState, React.ReactNode> = {
	done: (
		<CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Concluído" />
	),
	pending: <Clock className="h-5 w-5 text-gray-400" aria-label="Pendente" />,
	ended: <Ban className="h-5 w-5 text-red-600" aria-label="Encerrado" />,
};

// The contract exists from the acceptance on
const HAS_CONTRACT = new Set([
	"Aceita",
	"AguardandoPagamento",
	"ContratacaoConcluida",
]);

/**
 * "Acompanhar contratação" on the chat cards: the hiring's steps read from the
 * proposal when opened, so it stays right after things that happen outside the
 * app (the D4Sign signatures) or after the card was sent
 */
export const HiringProgressModal = ({
	proposal,
	isSeller,
	onClose,
	onSeeProposal,
	onSeeContract,
	onConfirmDownPayment,
}: HiringProgressModalProps) => {
	if (!proposal) return null;

	const { steps, nextStep, concluded, ended } = hiringSteps(proposal);
	const canConfirmDownPayment = isSeller && awaitsDownPayment(proposal);

	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="max-w-lg">
				<div className="pr-8">
					<DialogTitle className="text-xl font-bold text-gray-900">
						Andamento da contratação
					</DialogTitle>
					<DialogDescription className="mt-1 text-sm text-gray-500">
						{[
							proposal.tipoEvento?.nome,
							day(proposal.dataInicio),
							proposal.produtoMusical.nome,
						]
							.filter(Boolean)
							.join(" · ")}
					</DialogDescription>
				</div>

				<ol className="flex flex-col">
					{steps.map((step, index) => (
						<li key={step.label} className="flex gap-3">
							{/* Icon with the line linking it to the next step */}
							<div className="flex flex-col items-center">
								{STEP_ICONS[step.state]}
								{index < steps.length - 1 ? (
									<span
										className={`my-1 w-px flex-1 ${
											step.state === "done" ? "bg-green-300" : "bg-gray-200"
										}`}
									/>
								) : null}
							</div>
							<div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 pb-4">
								<span
									className={`text-sm font-medium ${
										step.state === "pending" ? "text-gray-400" : "text-gray-900"
									}`}
								>
									{step.label}
								</span>
								{step.detail ? (
									<span className="text-xs text-gray-500">{step.detail}</span>
								) : null}
							</div>
						</li>
					))}
				</ol>

				{nextStep ? (
					<p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
						<span className="font-semibold text-gray-900">Próximo passo: </span>
						{nextStep}
					</p>
				) : null}
				{concluded ? (
					<p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
						Contratação concluída 🎉
					</p>
				) : null}
				{ended ? (
					<p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-medium text-gray-700">
						Processo encerrado.
					</p>
				) : null}

				<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end [&>*]:whitespace-nowrap">
					{canConfirmDownPayment ? (
						<Button
							size="sm"
							className="bg-green-600 hover:bg-green-700 border-green-600"
							onClick={() => {
								onConfirmDownPayment(proposal);
							}}
						>
							<DollarSign className="mr-2 h-4 w-4" />
							Confirmar Recebimento do Sinal
						</Button>
					) : null}
					{HAS_CONTRACT.has(proposal.status.nome) ? (
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								onSeeContract(proposal.identificadorUnico);
							}}
						>
							<PenLine className="mr-2 h-4 w-4" />
							Ver contrato
						</Button>
					) : null}
					<Button size="sm" variant="outline" onClick={onSeeProposal}>
						<Eye className="mr-2 h-4 w-4" />
						Ver proposta
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

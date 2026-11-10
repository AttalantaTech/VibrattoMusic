import { format, parseISO } from "date-fns";
import type { ProposalResponse } from "@/api/types";
import { acceptsCounterProposal } from "./proposalRoles";
import { handleCurrencyFormatting } from "@/utils";
import { proposalDownPayment, requiresDownPayment } from "./calculateSignal";

export type StepState = "done" | "pending" | "ended";

export interface HiringStep {
	label: string;
	state: StepState;
	/** Date, amount or deadline shown beside the step */
	detail?: string;
}

// Day only: a bare date would shift a day back in UTC-3
export const day = (date: string | null | undefined) =>
	date ? format(parseISO(date.slice(0, 10)), "dd/MM/yyyy") : undefined;

const BOTH_SIGNED = new Set(["AguardandoPagamento", "ContratacaoConcluida"]);
const ACCEPTED = new Set(["Aceita", ...BOTH_SIGNED]);

// Standalone proposals have no registered contractor
const contractorName = (proposal: ProposalResponse) =>
	proposal.contratante.nome ||
	proposal.nomeContratante ||
	proposal.produtoMusicalContratante?.nome ||
	"o contratante";

/** How the process ended early, as the last step */
const ENDINGS: Record<string, string> = {
	Rejeitada: "Proposta recusada",
	Cancelada: "Proposta cancelada",
	Vencida: "Prazo vencido",
	Substituida: "Substituída por uma contraproposta",
};

/**
 * The hiring as it stands now, read from the proposal each time it is shown
 * (signatures happen on D4Sign, outside the app, so a saved chat card can't
 * keep up). Missing dates are ones the API doesn't return yet.
 */
export const hiringSteps = (proposal: ProposalResponse) => {
	const status = proposal.status.nome;
	const steps: Array<HiringStep> = [
		{
			label: "Proposta enviada",
			state: "done",
			detail: day(proposal.dataCriacao),
		},
	];

	const ending = ENDINGS[status];
	if (ending) {
		steps.push({
			label: ending,
			state: "ended",
			detail:
				status === "Rejeitada" ? proposal.motivoRejeicao?.nome : undefined,
		});
		// Refused, but still open: the contractor asked for another proposal
		if (acceptsCounterProposal(proposal)) {
			return {
				steps,
				nextStep: `${contractorName(proposal)} aceita receber uma contraproposta de ${proposal.produtoMusical.nome}.`,
				concluded: false,
				ended: false,
			};
		}
		return { steps, nextStep: null, concluded: false, ended: true };
	}

	const accepted = ACCEPTED.has(status);
	const bothSigned = BOTH_SIGNED.has(status);
	const concluded = status === "ContratacaoConcluida";
	const contractorSigned = bothSigned || proposal.assinaturaContratante;
	const contractedSigned = bothSigned || proposal.assinaturaContratado;
	const hasDownPayment = requiresDownPayment(
		proposal.condicoesPagamento?.id ?? 0
	);
	const downPaymentPaid = concluded || !!proposal.sinalPago;

	const amount = proposalDownPayment(proposal);
	const amountLabel = amount ? `R$ ${handleCurrencyFormatting(amount)}` : "";
	const downPaymentDue = day(proposal.dataVencimentoSinalPagamento);

	steps.push({
		label: "Proposta aceita",
		state: accepted ? "done" : "pending",
		detail:
			accepted || !proposal.dataVencimentoAceite
				? undefined
				: `até ${day(proposal.dataVencimentoAceite)}`,
	});
	steps.push({
		label: "Contratante assinou",
		state: contractorSigned ? "done" : "pending",
		detail: contractorSigned
			? day(proposal.dataAssinaturaContratante)
			: undefined,
	});
	steps.push({
		label: "Contratado assinou",
		state: contractedSigned ? "done" : "pending",
		detail: contractedSigned
			? day(proposal.dataAssinaturaContratado)
			: undefined,
	});
	if (hasDownPayment) {
		steps.push({
			label: "Sinal pago",
			state: downPaymentPaid ? "done" : "pending",
			detail: downPaymentPaid
				? amountLabel || undefined
				: [amountLabel, downPaymentDue && `até ${downPaymentDue}`]
						.filter(Boolean)
						.join(" ") || undefined,
		});
	}
	steps.push({
		label: "Contratação concluída",
		state: concluded ? "done" : "pending",
	});

	let nextStep: string | null = null;
	if (!accepted) {
		nextStep = `${contractorName(proposal)} aceita ou recusa a proposta.`;
	} else if (!concluded) {
		const missing: Array<string> = [];
		const unsigned = [
			!contractorSigned && contractorName(proposal),
			!contractedSigned && proposal.produtoMusical.nome,
		].filter(Boolean);
		if (unsigned.length > 0) {
			missing.push(
				`Falta a assinatura de ${unsigned.join(" e ")} (pelo e-mail da D4Sign)`
			);
		}
		if (hasDownPayment && !downPaymentPaid) {
			missing.push(
				`${missing.length > 0 ? "falta" : "Falta"} o pagamento do sinal${amountLabel ? ` de ${amountLabel}` : ""} e a confirmação do recebimento por ${proposal.produtoMusical.nome}`
			);
		}
		nextStep =
			missing.length > 0
				? `${missing.join("; ")}.`
				: "Tudo certo. O status será atualizado em instantes.";
	}

	return { steps, nextStep, concluded, ended: false };
};

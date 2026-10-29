import { CheckCircle2, Clock, FileSignature } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ProposalResponse } from "@/api/types";

interface SignatureProgressProps {
	proposal: ProposalResponse;
	/** Whether the viewer is the contractor (otherwise the hired band) */
	isContractor: boolean;
}

// D4Sign steps before the document reaches the signers
const PREPARING_STEPS = new Set([
	"AguardandoEnvio",
	"EnvioDocumento",
	"EnvioSignatarios",
	"EnvioAssinatura",
]);

// Day only: a bare date would shift a day back in UTC-3
const formatDay = (date: string) =>
	format(parseISO(date.slice(0, 10)), "dd/MM/yyyy");

/**
 * Who has already signed the contract and who is missing, while the proposal
 * is "Aceita". The back-end updates each party's signature as soon as D4Sign
 * reports it (by the signer's e-mail); it used to be a generic "if you
 * already signed, wait for the other party".
 */
export const SignatureProgress = ({
	proposal,
	isContractor,
}: SignatureProgressProps) => {
	if (proposal.status.nome !== "Aceita") return null;

	const contractor = {
		role: "Contratante",
		name:
			proposal.contratante.nome ||
			proposal.nomeContratante ||
			proposal.produtoMusicalContratante?.nome ||
			"Contratante",
		signed: proposal.assinaturaContratante,
		date: proposal.dataAssinaturaContratante,
	};
	const contracted = {
		role: "Contratado",
		name: proposal.produtoMusical.nome,
		signed: proposal.assinaturaContratado,
		date: proposal.dataAssinaturaContratado,
	};
	const viewer = isContractor ? contractor : contracted;
	const other = isContractor ? contracted : contractor;

	const isPreparing = PREPARING_STEPS.has(proposal.etapaD4Sign?.nome ?? "");

	let guidance: string;
	if (isPreparing) {
		guidance =
			"Preparando o contrato para assinatura. Em instantes cada parte recebe um e-mail da D4Sign com as instruções.";
	} else if (!viewer.signed) {
		guidance =
			"Confira o e-mail da D4Sign para assinar. Se não encontrar, procure também em Spam, Lixo Eletrônico ou Promoções. Se não chegar em alguns minutos, fale com o nosso suporte.";
	} else if (!other.signed) {
		guidance = `Você já assinou. Falta a assinatura de ${other.name}.`;
	} else {
		guidance =
			"As duas partes assinaram. O status será atualizado em instantes.";
	}

	return (
		<div className="my-4 rounded-lg border border-primary-200 bg-primary-50 p-4">
			<div className="flex gap-3">
				<FileSignature className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-600" />
				<div className="min-w-0 flex-1 text-sm text-primary-800">
					<p className="mb-3 font-medium">Assinatura do contrato</p>

					<ul className="mb-3 space-y-2">
						{[contractor, contracted].map((party) => (
							<li
								key={party.role}
								className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-md bg-white/70 px-3 py-2"
							>
								<span className="flex min-w-0 items-center gap-2">
									{party.signed ? (
										<CheckCircle2
											className="h-4 w-4 shrink-0 text-green-600"
											aria-label="Assinado"
										/>
									) : (
										<Clock
											className="h-4 w-4 shrink-0 text-amber-600"
											aria-label="Aguardando"
										/>
									)}
									<span className="truncate">
										<span className="text-gray-500">{party.role} · </span>
										<span className="font-medium text-gray-900">
											{party.name}
										</span>
									</span>
								</span>
								<span
									className={party.signed ? "text-green-700" : "text-amber-700"}
								>
									{party.signed
										? party.date
											? `assinado em ${formatDay(party.date)}`
											: "assinado"
										: "aguardando assinatura"}
								</span>
							</li>
						))}
					</ul>

					<p>{guidance}</p>
				</div>
			</div>
		</div>
	);
};

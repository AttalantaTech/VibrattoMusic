import type { ProposalResponse, User } from "@/api/types";

/**
 * The down payment can be confirmed from the acceptance on, before or after
 * the signatures, until it is paid. "Aguardando Pagamento" (both signed) always
 * has one; in "Aceita" only when the payment condition asks for it
 */
export const awaitsDownPayment = (
	proposal: ProposalResponse | null | undefined
) => {
	if (!proposal || proposal.sinalPago) return false;
	const status = proposal.status.nome;
	return (
		status === "AguardandoPagamento" ||
		(status === "Aceita" && !!proposal.possuiSinalPagamento)
	);
};

/**
 * Who is looking at the proposal and which actions its status allows. Used by
 * the details dialog and the contract page so both show the same buttons.
 */
export const proposalRoles = ({
	productContractorId,
	proposal,
	user,
}: {
	productContractorId: number | null;
	proposal: ProposalResponse | null | undefined;
	user: User | null;
}) => {
	const isWaitingForResponse = proposal?.status.nome === "Pendente";

	const isContractor =
		proposal?.produtoMusicalContratante.id === productContractorId ||
		user?.id === proposal?.contratante.id;

	const isAcceptedStatus = proposal?.status.nome === "Aceita";
	// Only the professional confirms it was received
	const needsContractorPaidSign = !isContractor && awaitsDownPayment(proposal);

	const signedContract = proposal?.status.nome === "ContratacaoConcluida";

	return {
		isWaitingForResponse,
		isContractor,
		isAcceptedStatus,
		needsContractorPaidSign,
		signedContract,
	};
};

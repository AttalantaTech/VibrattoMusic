import type { ProposalResponse, User } from "@/api/types";

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
	const needsContractorPaidSign =
		!isContractor && proposal?.status.nome === "AguardandoPagamento";

	const signedContract = proposal?.status.nome === "ContratacaoConcluida";

	return {
		isWaitingForResponse,
		isContractor,
		isAcceptedStatus,
		needsContractorPaidSign,
		signedContract,
	};
};

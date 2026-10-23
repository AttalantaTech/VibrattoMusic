import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import type { CreateProposalRequest } from "@/api/types";
import { useCreateProposal } from "@/hooks/useProposals";
import { ensureHHMMSS, toBR } from "@/utils";
import type { CreateProposalForm } from "../schemas/proposal.schema";
import { addDays, format, isBefore } from "date-fns";
import { showApiError } from "@/utils/showApiError";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { entityLinks } from "@/features/message/utils/messageTemplates";

interface UseBudgetSubmitProps {
	setShowProfileIncompleteModal: (value: boolean) => void;
	handleClose: () => void;
	contractorId: number;
	musicalProductId: number | null;
	musicalProductContractorId: number | null;
	conversationId?: number;
	hasDefineEventTime: boolean;
}

const formatDate = (dateString: string) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("pt-BR");
};

// Helper function to extract user ID from JWT token
const getUserIdFromToken = (): number | null => {
	try {
		const { token } = useAuthStore.getState();
		if (!token) return null;

		const tokenParts = token.split(".");
		if (tokenParts.length !== 3) return null;

		const payloadString = tokenParts[1];
		if (!payloadString) return null;

		const payload = JSON.parse(atob(payloadString)) as {
			sub?: string;
			userId?: string | number;
			nameid?: string;
			unique_name?: string;
		};

		// Try different common JWT fields for user ID
		const possibleIds = [
			payload.sub,
			payload.userId,
			payload.nameid,
			payload.unique_name,
		];

		for (const id of possibleIds) {
			if (id) {
				const numericId = Number(id);
				if (!isNaN(numericId) && numericId > 0) {
					return numericId;
				}
			}
		}

		return null;
	} catch (error) {
		console.warn("⚠️ Could not extract user ID from token:", error);
		return null;
	}
};

export const useBudgetSubmit = ({
	setShowProfileIncompleteModal,
	contractorId,
	musicalProductId,
	handleClose,
	hasDefineEventTime,
	conversationId,
	musicalProductContractorId,
}: UseBudgetSubmitProps) => {
	const { user } = useAuthStore();
	const { isProfileComplete, refetch: refetchProfile } = useProfileStatus();
	const createProposalMutation = useCreateProposal();
	const { sendStatusMessage } = useSendStatusMessage();

	const onSubmit = async (budgetFormData: CreateProposalForm) => {
		// Refresh profile data to ensure we have the latest information
		await refetchProfile();

		// Check if user has a complete profile
		if (!isProfileComplete) {
			setShowProfileIncompleteModal(true);
			return;
		}

		// Check if user has a musical product
		if (!musicalProductId) {
			toast.error(
				"Você precisa ter um produto musical cadastrado para enviar propostas."
			);
			return;
		}

		// Try multiple sources for contractor ID
		const contractorIdToUse =
			contractorId ||
			budgetFormData.idContratante ||
			user?.id ||
			getUserIdFromToken();

		// Set contractor ID to current user if not already set
		const finalFormData = {
			...budgetFormData,
			idContratante: contractorIdToUse || 0,
		};

		// Validate contractor ID more robustly
		if (!finalFormData.idContratante || finalFormData.idContratante === 0) {
			// More specific error messages
			if (!user) {
				toast.error("Você precisa estar logado para enviar uma proposta.");
			} else {
				toast.error(
					"Erro: Não foi possível identificar o usuário. Por favor, faça login novamente."
				);
			}
			return;
		}

		const eventDate = toBR(finalFormData.dataEvento) || "";
		const todayDate = toBR(new Date());

		const isBeforeDate = isBefore(eventDate, todayDate);

		const dataVencimentoAceite = format(
			addDays(
				isBeforeDate ? todayDate : eventDate,
				finalFormData.dataVencimentoAceite
			),
			"yyyy-MM-dd"
		);
		const dataVencimentoSinalPagamento = format(
			addDays(
				isBeforeDate ? todayDate : eventDate,
				finalFormData.dataVencimentoSinalPagamento
			),
			"yyyy-MM-dd"
		);

		// Build payload in camelCase exactly as API expects
		const budgetData: CreateProposalRequest = {
			idConversa: conversationId || 0,
			nomeContratante: String(
				finalFormData.nomeContratante || user?.nome || ""
			),
			idProdutoMusical: musicalProductId,
			idTipoEvento: Number(finalFormData.idTipoEvento),
			descricao: finalFormData.descricao || "",
			valor: Number(finalFormData.valor),
			local: finalFormData.local,
			dataEvento: format(eventDate, "yyyy-MM-dd"),
			dataVencimentoAceite,
			dataVencimentoSinalPagamento,
			duracao: hasDefineEventTime ? finalFormData.duracao : null,
			horaInicio: hasDefineEventTime
				? ensureHHMMSS(String(finalFormData.horaInicio || "").trim())
				: null,
			formaPagamento: finalFormData.formaPagamento ?? [],
			idCondicoesPagamento: finalFormData.idCondicoesPagamento,
			idCondicoesPagamentoRestante: null,
			tipoSinalPagamento: null,
			valorSinalPagamento: null,
			transporteIncluso: Boolean(finalFormData.transporteIncluso),
			acomodacaoInclusa: Boolean(finalFormData.acomodacaoInclusa),
			camarimIncluso: false,
			idPropostaGerouContraProposta: null,
			idOrcamento: finalFormData.idOrcamento,
		};

		try {
			const proposalResponse = await createProposalMutation.mutateAsync({
				productId: musicalProductId,
				data: budgetData,
			});

			sendStatusMessage({
				type: "proposalRequested",
				produtoMusicalId: musicalProductId,
				produtoMusicalName: finalFormData.nomeContratante || "",
				contratanteId: finalFormData.idContratante,
				produtoMusicalContratanteId: musicalProductContractorId,
				senderType: musicalProductContractorId ? 2 : 1,
				link: proposalResponse.proposta
					? entityLinks.proposalTab(proposalResponse.proposta)
					: undefined,
				payload: {
					eventTypeLabel: budgetData.dataEvento || "-",
					description: budgetData.descricao,
					date: formatDate(budgetData.dataEvento),
					startTime: hasDefineEventTime ? budgetData.horaInicio : null,
					duration:
						hasDefineEventTime && budgetData.duracao
							? budgetData.duracao
							: null,
					location: budgetData.local,
				},

				errorMessage: "Erro ao enviar solicitação orçamento",
				onSuccess: () => {
					handleClose();
				},
			});
		} catch (error) {
			showApiError(error, "Erro ao enviar proposta. Tente novamente.");
		}
	};

	return { onSubmit };
};

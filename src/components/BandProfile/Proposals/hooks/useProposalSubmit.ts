import { messagingService } from "@/api";
import type { Conversation } from "@/api/services/messages/types";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import type {
	CreateProposalRequest,
	FilterOption,
	ProposalResponse,
} from "@/api/types";
import { useCreateProposal } from "@/hooks/useProposals";
import { ensureHHMMSS, toBR } from "@/utils";
import type { CreateProposalForm } from "../schemas/proposal.schema";
import { addDays, format, isBefore } from "date-fns";
import { showApiError } from "@/utils/showApiError";
import { useSendStatusMessage } from "@/features/message/hooks/useSendStatusMessage";
import { entityLinks } from "@/features/message/utils/messageTemplates";
import { formatDate } from "@/utils/validation";

interface UseProposalSubmitProps {
	setShowProfileIncompleteModal: (value: boolean) => void;
	handleClose: () => void;
	proposal?: ProposalResponse | null;
	contractorId: number;
	userProductId?: number;
	conversationId?: number;
	hasDefineEventTime: boolean;
	eventTypes: Array<FilterOption>;
	paymentMethods: Array<FilterOption>;
	paymentConditions: Array<FilterOption>;
}

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

export const useProposalSubmit = ({
	setShowProfileIncompleteModal,
	proposal,
	contractorId,
	userProductId,
	conversationId,
	handleClose,
	hasDefineEventTime,
}: UseProposalSubmitProps) => {
	const { user } = useAuthStore();
	const { isProfileComplete, refetch: refetchProfile } = useProfileStatus();
	const createProposalMutation = useCreateProposal();
	const { sendStatusMessage } = useSendStatusMessage();

	const onSubmit = async (proposalFormData: CreateProposalForm) => {
		// Refresh profile data to ensure we have the latest information
		await refetchProfile();

		// Check if user has a complete profile
		if (!isProfileComplete) {
			setShowProfileIncompleteModal(true);
			return;
		}

		// Check if user has a musical product
		if (!userProductId) {
			toast.error(
				"Você precisa ter um produto musical cadastrado para enviar propostas."
			);
			return;
		}

		// Try multiple sources for contractor ID
		const contractorIdToUse =
			contractorId ||
			proposalFormData.idContratante ||
			user?.id ||
			getUserIdFromToken();

		// Set contractor ID to current user if not already set
		const finalFormData = {
			...proposalFormData,
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

		let conversation: Conversation | undefined | null = null;

		if (proposal) {
			const conversations = await messagingService.getConversations(
				proposal.produtoMusical.id
			);

			conversation = conversations
				? conversations.find(
						(c) =>
							c.produtoMusicalContratanteId ===
								proposal.produtoMusicalContratante.id ||
							c.contratanteId === proposal.contratante.id
					)
				: null;
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
		const proposalData: CreateProposalRequest = {
			id: proposal?.id,
			idConversa: Number(conversation?.id || conversationId) || 0,
			nomeContratante: String(
				finalFormData.nomeContratante || user?.nome || ""
			),
			idProdutoMusical: Number(userProductId),
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
			camarimIncluso: Boolean(finalFormData.camarimIncluso),
			estruturaPalcoSomIluminacaoInclusa: Boolean(
				finalFormData.estruturaPalcoSomIluminacaoInclusa
			),
			// geradorIncluso: Boolean(finalFormData.geradorIncluso),
		};

		try {
			const data = proposal
				? {
						...proposalData,
						id: proposal.id,
						idConversa: conversation?.id || 0,
					}
				: proposalData;

			const proposalResponse = await createProposalMutation.mutateAsync({
				productId: userProductId,
				data,
			});

			const produtoMusicalContratanteId = proposal
				? proposal?.produtoMusicalContratante.id > 0
					? proposal?.produtoMusicalContratante.id
					: 0
				: 0;

			const senderType = produtoMusicalContratanteId ? 2 : 1;

			console.log("userProductId", userProductId);
			console.log("produtoMusicalContratanteId", produtoMusicalContratanteId);

			sendStatusMessage({
				type: "proposalRequested",
				produtoMusicalId: userProductId,
				produtoMusicalName: finalFormData.nomeContratante || "",
				contratanteId: finalFormData.idContratante,
				produtoMusicalContratanteId,
				senderType,
				link: proposalResponse.proposta
					? entityLinks.proposalTab(proposalResponse.proposta)
					: undefined,
				payload: {
					eventTypeLabel: data.dataEvento || "-",
					description: data.descricao,
					date: formatDate(data.dataEvento),
					startTime: hasDefineEventTime ? data.horaInicio : null,
					duration: hasDefineEventTime && data.duracao ? data.duracao : null,
					location: data.local,
				},

				errorMessage: "Erro ao enviar solicitação orçamento",
				onSuccess: () => {
					handleClose();
				},
			});
		} catch (error) {
			showApiError(error, "Erro ao enviar proposta. Tente novamente.");
		}

		handleClose();
	};

	return { onSubmit };
};

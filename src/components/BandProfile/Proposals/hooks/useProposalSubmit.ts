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
import {
	proposalParties,
	resolveStatusSender,
	type ProposalParties,
} from "@/features/message/utils/resolveStatusSender";
import { formatDate } from "@/utils/validation";
import { calculateSignal, requiresDownPayment } from "../utils/calculateSignal";

interface UseProposalSubmitProps {
	setShowProfileIncompleteModal: (value: boolean) => void;
	handleClose: () => void;
	proposal?: ProposalResponse | null;
	contractorId?: number;
	contractorProductId?: number | null;
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
	contractorProductId,
	userProductId,
	conversationId,
	handleClose,
	hasDefineEventTime,
	eventTypes,
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
			proposal?.contratante.id ||
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

		const parties: ProposalParties = proposal
			? proposalParties(proposal)
			: {
					produtoMusicalId: userProductId,
					contratanteId: finalFormData.idContratante,
					produtoMusicalContratanteId: contractorProductId ?? null,
				};

		let conversation: Conversation | undefined | null = null;

		if (proposal) {
			const conversations = await messagingService.getConversations({
				IdProdutoMusical: proposal.produtoMusical.id,
			});

			conversation =
				conversations.find((c) =>
					parties.produtoMusicalContratanteId
						? c.produtoMusicalContratanteId ===
							parties.produtoMusicalContratanteId
						: !c.produtoMusicalContratanteId &&
							c.contratanteId === parties.contratanteId
				) ?? null;
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
		// No down payment ("À vista no dia do evento") means no due date
		const dataVencimentoSinalPagamento = requiresDownPayment(
			finalFormData.idCondicoesPagamento
		)
			? format(
					addDays(
						isBeforeDate ? todayDate : eventDate,
						finalFormData.dataVencimentoSinalPagamento
					),
					"yyyy-MM-dd"
				)
			: null;

		const { tipoSinalPagamento, valorSinalPagamento } = calculateSignal({
			conditionId: finalFormData.idCondicoesPagamento,
			customValue: finalFormData.valorSinalPagamento,
		});

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
			tipoSinalPagamento,
			valorSinalPagamento,
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

			const newValueConversationId = conversation?.id || conversationId;

			if (!newValueConversationId) {
				handleClose();
				return;
			}

			const eventTypeLabel =
				eventTypes.find((event) => event.Id === data.idTipoEvento)?.Nome || "";

			sendStatusMessage({
				type: "proposalRequested",
				...resolveStatusSender(parties, "contratado"),
				conversationId: newValueConversationId,
				produtoMusicalName: finalFormData.nomeContratante || "",
				link: proposalResponse.proposta
					? entityLinks.proposalTab(proposalResponse.proposta)
					: undefined,
				payload: {
					eventTypeLabel,
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
	};

	return { onSubmit };
};

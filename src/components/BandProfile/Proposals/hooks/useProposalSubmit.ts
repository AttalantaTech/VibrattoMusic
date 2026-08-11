import { messagingService } from "@/api";
import type { Conversation } from "@/api/services/messages/types";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { messagingKeys } from "@/hooks/useMessaging";
import type {
	CreateProposalRequest,
	FilterOption,
	ProposalResponse,
} from "@/api/types";
import { useCreateProposal } from "@/hooks/useProposals";
import type { ProposalFormData } from "../types";
import { combineDateTime, ensureHHMMSS } from "@/utils";

interface UseProposalSubmitProps {
	setShowProfileIncompleteModal: (value: boolean) => void;
	onProposalSent?: (proposalDetails: string) => Promise<void>;
	handleClose: () => void;
	proposal?: ProposalResponse | null;
	contractorId?: number;
	userProductId?: number;
	conversationId?: number;
	hasDefineEventTime: boolean;
	eventTypes: Array<FilterOption>;
	paymentMethods: Array<FilterOption>;
	paymentConditions: Array<FilterOption>;
}

const formatDate = (dateString: string) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("pt-BR");
};

const formatTime = (timeString: string) => {
	if (!timeString) return "";
	// Remove seconds if present
	return timeString.substring(0, 5);
};

const buildProposalMessage = (
	proposalData: CreateProposalRequest,
	eventTypes: Array<FilterOption>,
	paymentMethods: Array<FilterOption>,
	paymentConditions: Array<FilterOption>
): string => {
	const baseURL = import.meta.env["VITE_VIBRATTO_FRONT_BASE_URL"];
	const propostaURL = `${baseURL}band/me?tab=hires`;

	const eventTypeName =
		eventTypes.find((type) => type.Id === proposalData.idTipoEvento)?.Nome ||
		"Evento";

	const selectedPaymentMethods = paymentMethods
		.filter((method) => proposalData.formaPagamento.includes(method.Id))
		.map((item) => item.Nome)
		.join(", ");

	const paymentCondition = paymentConditions.find(
		(condition) => condition.Id === proposalData.idCondicoesPagamento
	)?.Nome;

	const datesFormatted =
		proposalData.dataFim && proposalData.dataFim !== proposalData.dataInicio
			? `${formatDate(proposalData.dataInicio)} até ${formatDate(proposalData.dataFim)}`
			: formatDate(proposalData.dataInicio);

	const timesFormatted =
		proposalData.horaInicio && proposalData.horaFim
			? `${formatTime(proposalData.horaInicio)} - ${formatTime(proposalData.horaFim)}\n`
			: `Não definido`;

	const inclusions = [
		proposalData.transporteIncluso && "Transporte",
		proposalData.acomodacaoInclusa && "Acomodação",
	]
		.filter(Boolean)
		.join(", ");

	return [
		`📋 Proposta enviada!`,
		`🎵 Tipo de Evento: ${eventTypeName}`,
		`📝 Descrição: ${proposalData.descricao}`,
		`📅 Data: ${datesFormatted}`,
		`⏰ Horário: ${timesFormatted}`,
		`📍 Local: ${proposalData.local}`,
		`💰 Valor: R$ ${proposalData.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
		selectedPaymentMethods
			? `💳 Forma de Pagamento: ${selectedPaymentMethods}`
			: null,
		paymentCondition ? `📜 Condições de Pagamento: ${paymentCondition}` : null,
		inclusions ? `\n✅ Inclui: ${inclusions}` : null,
		`\n🔗 Link da proposta: ${propostaURL}`,
	]
		.filter(Boolean)
		.join("\n");
};

export const useProposalSubmit = ({
	setShowProfileIncompleteModal,
	onProposalSent,
	proposal,
	contractorId,
	userProductId,
	conversationId,
	eventTypes,
	paymentMethods,
	paymentConditions,
	handleClose,
	hasDefineEventTime,
}: UseProposalSubmitProps) => {
	const { user } = useAuthStore();
	const { isProfileComplete, refetch: refetchProfile } = useProfileStatus();
	const queryClient = useQueryClient();
	const createProposalMutation = useCreateProposal();

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

	const onSubmit = async (proposalFormData: ProposalFormData) => {
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
			IdContratante: contractorIdToUse || 0,
		};

		// Validate contractor ID more robustly
		if (!finalFormData.IdContratante || finalFormData.IdContratante === 0) {
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

		// Build payload in camelCase exactly as API expects
		const proposalData: CreateProposalRequest = {
			id: proposal?.id,
			idConversa: Number(conversation?.id || conversationId) || 0,
			nomeContratante: String(
				finalFormData.nomeContratante || user?.nome || ""
			),
			idProdutoMusical: Number(userProductId),
			idTipoEvento: Number(finalFormData.idTipoEvento) || 0,
			descricao: String(finalFormData.descricao || ""),
			valor: Number(finalFormData.valor) || 0,
			local: String(finalFormData.local || ""),
			dataInicio: combineDateTime(
				String(finalFormData.dataInicio || "").trim(),
				String(finalFormData.horaInicio || "").trim()
			),
			dataFim: hasDefineEventTime
				? combineDateTime(
						String(finalFormData.dataFim || "").trim(),
						String(finalFormData.horaFim || "").trim()
					)
				: null,
			horaInicio: hasDefineEventTime
				? ensureHHMMSS(String(finalFormData.horaInicio || "").trim())
				: null,
			horaFim: hasDefineEventTime
				? ensureHHMMSS(String(finalFormData.horaFim || "").trim())
				: null,
			formaPagamento: finalFormData.formaPagamento ?? [],
			idCondicoesPagamento: Number(finalFormData.idCondicoesPagamento || 0),
			idCondicoesPagamentoRestante:
				finalFormData.idCondicoesPagamentoRestante ?? null,
			tipoSinalPagamento: finalFormData.tipoSinalPagamento ?? null,
			valorSinalPagamento: finalFormData.valorSinalPagamento ?? null,
			dataVencimentoSinalPagamento:
				finalFormData.dataVencimentoSinalPagamento ?? null,
			transporteIncluso: Boolean(finalFormData.transporteIncluso),
			acomodacaoInclusa: Boolean(finalFormData.acomodacaoInclusa),
			camarimIncluso: false,
		};

		try {
			const data = proposal
				? {
						...proposalData,
						id: proposal.id,
						idConversa: conversation?.id || 0,
					}
				: proposalData;

			await createProposalMutation.mutateAsync({
				productId: userProductId,
				data,
			});

			// Send automatic message to chat if callback is provided
			if (onProposalSent) {
				try {
					const proposalMessage = buildProposalMessage(
						proposalData,
						eventTypes,
						paymentMethods,
						paymentConditions
					);
					await onProposalSent(proposalMessage);
				} catch (error) {
					console.warn("Failed to send proposal notification message:", error);
				}
			}

			// Invalidate conversations to update sidebar with new proposal message
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.conversations(),
			});

			handleClose();
		} catch (error) {
			// Show user-friendly error message
			if (error && typeof error === "object" && "response" in error) {
				const apiError = error as {
					response?: { status?: number; data?: any };
				};
				if (apiError.response?.status === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
				} else {
					toast.error("Erro ao enviar proposta. Tente novamente.");
				}
			}
		}
	};
	return { onSubmit };
};

import { messagingService, VibrattoApiError } from "@/api";
import type { Conversation } from "@/api/services/messages/types";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useAuthStore } from "@/store/authStore";
import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { messagingKeys } from "@/hooks/useMessaging";
import type {
	CreateProposalRequest,
	FilterOption,
	ProposalResponse,
} from "@/api/types";
import { useCreateProposal } from "@/hooks/useProposals";
import { ensureHHMMSS, toBR } from "@/utils";
import type { CreateProposalForm } from "../schemas/proposal.schema";
import { addDays, format, isBefore } from "date-fns";

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

interface HandleSendMessageProps {
	onProposalSent?: (proposalDetails: string) => Promise<void>;
	proposalData: CreateProposalRequest;
	eventTypes: Array<FilterOption>;
	paymentMethods: Array<FilterOption>;
	paymentConditions: Array<FilterOption>;
	queryClient: QueryClient;
}

const formatDate = (dateString: string) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("pt-BR");
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

	const timesFormatted = proposalData.horaInicio
		? `${proposalData.horaInicio}\n`
		: `Não definido\n`;

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
		`📅 Data: ${formatDate(proposalData.dataEvento)}`,
		`⏰ Horário: ${timesFormatted}`,
		`📍 Local: ${proposalData.local}`,
		`💰 Valor: R$ ${proposalData.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
		selectedPaymentMethods
			? `💳 Forma de Pagamento: ${selectedPaymentMethods}`
			: null,
		paymentCondition ? `📜 Condições de Pagamento: ${paymentCondition}` : null,
		inclusions ? `\n✅ Inclui: ${inclusions}` : null,
		`\n🔗 Link da proposta: <a 
								href=${propostaURL} 
								target="_blank" 
								rel="noopener noreferrer"
								className="text-blue-600 underline hover:text-blue-800 font-medium transition-colors"
							>
								Clique aqui para acessar
							</a>`,
	]
		.filter(Boolean)
		.join("\n");
};

const handleSendMessage = async ({
	onProposalSent,
	proposalData,
	eventTypes,
	paymentMethods,
	paymentConditions,
	queryClient,
}: HandleSendMessageProps) => {
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
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
					return;
				} else if (errorMessage) {
					toast.error(errorMessage);
					return;
				}
				toast.error(
					"Aconteceu um erro ao enviar a mensagem de notificação da proposta."
				);
				return;
			}
		}
	}

	// Invalidate conversations to update sidebar with new proposal message
	void queryClient.invalidateQueries({
		queryKey: messagingKeys.conversations(),
	});
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

			await createProposalMutation.mutateAsync({
				productId: userProductId,
				data,
			});
		} catch (error) {
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
					return;
				} else if (errorMessage) {
					toast.error(errorMessage);
					return;
				}
				toast.error("Erro ao enviar proposta. Tente novamente.");
				return;
			}
		}

		await handleSendMessage({
			onProposalSent,
			proposalData,
			eventTypes,
			paymentMethods,
			paymentConditions,
			queryClient,
		});

		handleClose();
	};
	return { onSubmit };
};

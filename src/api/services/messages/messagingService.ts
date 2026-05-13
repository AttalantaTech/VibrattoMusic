import type { ApiClient } from "../../core/client";
import type {
	SendMessageRequest,
	Notification,
	PaginationParameters,
	PaginatedResponse,
} from "../../types";
import { ConversationStorage } from "../../../utils/conversationStorage";
import type { Conversation, Message } from "./types";
import type { ChatUser } from "@/contexts/MessagesContext/types";
import { musicalProductService } from "@/api";

export class MessagingService {
	public constructor(private readonly apiClient: ApiClient) {}

	// Messages
	/**
	 * Send a message
	 */
	public async sendMessage(messageData: SendMessageRequest): Promise<Message> {
		const response = await this.apiClient.post<Message>(
			"chat/mensagem",
			messageData
		);

		// Update last activity in localStorage if we have a conversation ID
		if (messageData.conversationId) {
			// Try to parse conversation ID from request
			const conversationId =
				typeof messageData.conversationId === "string"
					? parseInt(messageData.conversationId, 10)
					: Number(messageData.conversationId);
			if (!isNaN(conversationId)) {
				ConversationStorage.updateLastActivity(conversationId);
			}
		} else if (response.idConversa) {
			// Try to parse conversation ID from response as fallback
			const conversationId =
				typeof response.idConversa === "string"
					? parseInt(response.idConversa, 10)
					: Number(response.idConversa);
			if (!isNaN(conversationId)) {
				ConversationStorage.updateLastActivity(conversationId);
			}
		}

		return response;
	}

	/**
	 * Get message by ID
	 */
	public async getMessage(messageId: number): Promise<Message> {
		return this.apiClient.get<Message>(`chat/mensagem/${messageId}`);
	}

	/**
	 * Get all messages for user
	 */
	public async getMessages(
		parameters?: PaginationParameters & { conversaId?: number }
	): Promise<PaginatedResponse<Message>> {
		const queryParameters = new URLSearchParams();
		if (parameters?.page)
			queryParameters.append("page", parameters.page.toString());
		if (parameters?.limit)
			queryParameters.append("limit", parameters.limit.toString());
		if (parameters?.conversaId)
			queryParameters.append("conversaId", parameters.conversaId.toString());
		if (parameters?.orderBy)
			queryParameters.append("orderBy", parameters.orderBy);
		if (parameters?.orderDirection)
			queryParameters.append("orderDirection", parameters.orderDirection);
		const queryString = queryParameters.toString();
		const url = "chat/mensagem" + (queryString ? "?" + queryString : "");
		return this.apiClient.get<PaginatedResponse<Message>>(url);
	}

	/**
	 * Mark message as read
	 */
	public async markAsRead(messageId: number): Promise<void> {
		return this.apiClient.patch<void>(`chat/mensagem/${messageId}/lida`);
	}

	/**
	 * Mark multiple messages as read
	 */
	public async markMultipleAsRead(messageIds: Array<number>): Promise<void> {
		return this.apiClient.patch<void>("chat/mensagem/mark-read", {
			messageIds,
		});
	}

	/**
	 * Delete message
	 */
	public async deleteMessage(messageId: number): Promise<void> {
		return this.apiClient.delete<void>(`chat/mensagem/${messageId}`);
	}

	/**
	 * Reply to message
	 */
	public async replyToMessage(
		messageId: number,
		conteudo: string
	): Promise<Message> {
		return this.apiClient.post<Message>(`chat/mensagem/${messageId}/reply`, {
			conteudo,
		});
	}

	// Conversations
	/**
	 * Get all conversations for the current user
	 * Uses the direct API endpoint chat/listaConversas
	 */
	public async getConversations(
		IdProdutoMusical?: number | null,
		parameters?: PaginationParameters
	): Promise<Array<Conversation>> {
		try {
			const limit = parameters?.limit || 20;
			const cursorQuery = parameters?.page ? `&_t=${parameters.page}` : "";

			const response = await this.apiClient.get<
				Array<{
					idConversa: number;
					contratante: {
						id: number;
						nome: string;
					};
					produtoMusical: {
						id: number;
						nome: string;
					};
					produtoMusicalContratante: {
						id: number;
						nome: string;
					} | null;
					ultimaConversa: Message | null;
					numeroMensagensNãoLidasContratado: number;
					numeroMensagensNãoLidasContratante: number;
				}>
			>(`chat/listaConversas?limit=${limit}${cursorQuery}`, {
				params: {
					IdProdutoMusical,
				},
			});
			// Ensure response is an array
			const conversationsData = Array.isArray(response) ? response : [];

			// Transform API response to Conversation format
			const transformedConversations: Array<Conversation> = await Promise.all(
				conversationsData.map(async (item) => {
					// Transform last message if it exists
					let lastMessage: Message | undefined;
					if (item.ultimaConversa) {
						lastMessage = {
							id: item.ultimaConversa.id || 0,
							idConversa: item.idConversa,
							idRemetente: item.ultimaConversa.idRemetente || 0,
							nomeRemetente: item.ultimaConversa.nomeRemetente || "",
							conteudo: item.ultimaConversa.conteudo || "",
							type: "text" as const,
							lida: item.ultimaConversa.lida,
							dataEnvio:
								item.ultimaConversa.dataEnvio || new Date().toISOString(),

							// REVER
							idDestinatario: item.contratante.id,
							tipoDestinatario: IdProdutoMusical ? 2 : 1,
							tipoRemetente: IdProdutoMusical ? 2 : 1,
						};
					}

					const currentUserType = IdProdutoMusical ? "product" : "user";
					const isCurrentUserContractor =
						currentUserType === "user" ||
						item.produtoMusicalContratante?.id === IdProdutoMusical;

					const pair: ChatUser = {
						id: isCurrentUserContractor
							? item.produtoMusical.id
							: (item.produtoMusicalContratante?.id ?? item.contratante.id),
						name: isCurrentUserContractor
							? item.produtoMusical.nome
							: (item.produtoMusicalContratante?.nome ?? item.contratante.nome),
						type:
							currentUserType === "user"
								? "product"
								: isCurrentUserContractor ||
									  (!isCurrentUserContractor &&
											item.produtoMusicalContratante !== null)
									? "product"
									: "user",
						isContractor: !isCurrentUserContractor,
					};

					if (pair.type === "product") {
						pair.profileImageUrl = await musicalProductService
							.getProductById(pair.id)
							.then((products) => {
								if (products.length > 0) {
									return products[0]?.fotoPerfil || null;
								}
								return null;
							});
					}

					// Build conversation object
					return {
						id: item.idConversa,
						participanteId: item.produtoMusical.id,
						participanteNome: item.produtoMusical.nome,
						contratanteId: item.contratante.id,
						contratanteNome: item.contratante.nome,
						produtoMusicalContratanteId:
							item.produtoMusicalContratante?.id || null,
						produtoMusicalContratanteNome:
							item.produtoMusicalContratante?.nome || null,
						pair,
						ultimaMensagem: lastMessage,
						numeroMensagensNaoLidas: isCurrentUserContractor
							? item.numeroMensagensNãoLidasContratante
							: item.numeroMensagensNãoLidasContratado,
						online: false, // This would need to be determined from online status API
					};
				})
			);

			return transformedConversations;
		} catch (error) {
			console.error("Error fetching conversations:", error);
			// Return empty list on error
			return [];
		}
	}

	/**
	 * Get conversation by ID
	 */
	public async getConversation(conversationId: number): Promise<Conversation> {
		return this.apiClient.get<Conversation>(`chat/${conversationId}`);
	}

	/**
	 * Start new conversation
	 */
	public async startConversation(
		participanteId: number,
		conteudo: string,
		senderType: number,
		produtoMusicalContratanteId: number | null
	): Promise<Conversation> {
		// First, get or create conversation with the product
		// API returns conversation ID directly as a number
		const conversationId = await this.apiClient.post<number>("chat/obter", {
			IdProdutoMusical: participanteId,
			IdProdutoMusicalContratante: produtoMusicalContratanteId,
		});

		// Save conversation ID to localStorage for future retrieval
		ConversationStorage.saveConversation(
			conversationId,
			participanteId,
			undefined // We don't have participant name here yet
		);

		// Then send the initial message
		await this.apiClient.post<Message>("chat/mensagem", {
			IdConversa: conversationId,
			Conteudo: conteudo,
			TipoRemetente: senderType,
			IdProdutoMusical: produtoMusicalContratanteId,
		});

		// Return a minimal conversation object for compatibility
		return {
			id: conversationId,
			participanteId,
			participanteNome: "",
			contratanteId: 0,
			contratanteNome: "",
			produtoMusicalContratanteId,
			produtoMusicalContratanteNome: "",
			pair: {
				id: participanteId,
				name: "",
				type: "product",
			},
			ultimaMensagem: undefined,
			numeroMensagensNaoLidas: 0,
			online: false,
			mensagens: undefined,
			totalMensagens: undefined,
		};
	}

	/**
	 * Get conversation messages
	 * Uses the correct Vibratto API endpoint GET /chat/{id}
	 */
	public async getConversationMessages(
		conversationId: number,
		parameters?: PaginationParameters
	): Promise<Array<Message>> {
		try {
			if (conversationId <= 0) return [];

			const limit = parameters?.limit || 20;
			const cursorQuery = parameters?.page ? `&_t=${parameters.page}` : "";

			const response = await this.apiClient.get<Array<any>>(
				`chat/${conversationId}?limit=${limit}${cursorQuery}`
			);

			// Ensure response is an array
			const messages = Array.isArray(response) ? response : [];

			// Transform API response to Message format
			const transformedMessages: Array<Message> = messages.map(
				(message: any) => ({
					id: message.id || 0,
					idConversa: message.idConversa || conversationId,
					nomeRemetente: message.nomeRemetente || "",
					idRemetente: message.idRemetente || 0,
					conteudo: message.conteudo || "",
					lida: message.lida,
					dataEnvio: message.dataEnvio || new Date().toISOString(),
					type: "text",
					tipoDestinatario: message.tipoDestinatario,
					idDestinatario: message.idDestinatario,
					tipoRemetente: message.tipoRemetente,
				})
			);

			return transformedMessages;
		} catch (error) {
			console.error("Error fetching conversation messages:", error);
			// Return empty response on error
			return [];
		}
	}

	/**
	 * Mark conversation as read
	 */
	public async markConversationAsRead(conversationId: number): Promise<void> {
		return this.apiClient.patch<void>(`chat/lida/${conversationId}`);
	}

	/**
	 * Delete conversation
	 */
	public async deleteConversation(conversationId: number): Promise<void> {
		return this.apiClient.delete<void>(`chat/${conversationId}`);
	}

	// Notifications
	/**
	 * Get all notifications
	 */
	public async getNotifications(
		parameters?: PaginationParameters & { tipo?: string; lida?: boolean }
	): Promise<PaginatedResponse<Notification>> {
		const queryParameters = new URLSearchParams();
		if (parameters?.page)
			queryParameters.append("page", parameters.page.toString());
		if (parameters?.limit)
			queryParameters.append("limit", parameters.limit.toString());
		if (parameters?.tipo) queryParameters.append("tipo", parameters.tipo);
		if (parameters?.lida !== undefined)
			queryParameters.append("lida", parameters.lida.toString());
		if (parameters?.orderBy)
			queryParameters.append("orderBy", parameters.orderBy);
		if (parameters?.orderDirection)
			queryParameters.append("orderDirection", parameters.orderDirection);
		const queryString = queryParameters.toString();
		const url = "notifications" + (queryString ? "?" + queryString : "");
		return this.apiClient.get<PaginatedResponse<Notification>>(url);
	}

	/**
	 * Get notification by ID
	 */
	public async getNotification(notificationId: number): Promise<Notification> {
		return this.apiClient.get<Notification>(`notifications/${notificationId}`);
	}

	/**
	 * Mark notification as read
	 */
	public async markNotificationAsRead(notificationId: number): Promise<void> {
		return this.apiClient.patch<void>(`notifications/${notificationId}/read`);
	}

	/**
	 * Mark all notifications as read
	 */
	public async markAllNotificationsAsRead(): Promise<void> {
		return this.apiClient.patch<void>("notifications/mark-all-read");
	}

	/**
	 * Delete notification
	 */
	public async deleteNotification(notificationId: number): Promise<void> {
		return this.apiClient.delete<void>(`notifications/${notificationId}`);
	}

	/**
	 * Get unread notification count
	 */
	public async getUnreadCount(): Promise<{
		count: number;
		byType: Record<string, number>;
	}> {
		return this.apiClient.get<{
			count: number;
			byType: Record<string, number>;
		}>("notifications/unread-count");
	}

	/**
	 * Update notification preferences
	 */
	public async updateNotificationPreferences(preferences: {
		pushNotifications?: boolean;
		emailNotifications?: boolean;
		bookingNotifications?: boolean;
		messageNotifications?: boolean;
		ratingNotifications?: boolean;
		systemNotifications?: boolean;
	}): Promise<void> {
		return this.apiClient.put<void>("notifications/preferences", preferences);
	}

	/**
	 * Get notification preferences
	 */
	public async getNotificationPreferences(): Promise<{
		pushNotifications: boolean;
		emailNotifications: boolean;
		bookingNotifications: boolean;
		messageNotifications: boolean;
		ratingNotifications: boolean;
		systemNotifications: boolean;
	}> {
		return this.apiClient.get("notifications/preferences");
	}

	// Real-time messaging (WebSocket endpoints)
	/**
	 * Get WebSocket connection URL for real-time messaging
	 */ public getWebSocketUrl(): string {
		// Since ApiClient doesn't have getBaseUrl, use a fallback approach
		const baseUrl = "wss://api.vibratto.com";
		return baseUrl + "/ws/messages";
	}

	/**
	 * Send typing indicator
	 */
	public async sendTypingIndicator(
		conversationId: number,
		isTyping: boolean
	): Promise<void> {
		return this.apiClient.post<void>(`chat/${conversationId}/typing`, {
			isTyping,
		});
	}

	/**
	 * Get online status of user
	 */
	public async getUserOnlineStatus(
		userId: number
	): Promise<{ online: boolean; lastSeen?: string }> {
		return this.apiClient.get<{ online: boolean; lastSeen?: string }>(
			`users/${userId}/online-status`
		);
	}
}

import type { ApiClient } from "../core/client";
import type {
	Message,
	SendMessageRequest,
	Conversation,
	Notification,
	PaginationParameters,
	PaginatedResponse,
} from "../types";
import { ConversationStorage } from "../../utils/conversationStorage";

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
		} else if (response.conversationId) {
			// Try to parse conversation ID from response as fallback
			const conversationId =
				typeof response.conversationId === "string"
					? parseInt(response.conversationId, 10)
					: Number(response.conversationId);
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
		IdProdutoMusical: number | null | undefined,
		parameters?: PaginationParameters
	): Promise<PaginatedResponse<Conversation>> {
		try {
			// Call the direct API endpoint
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
					ultimaMensagem: {
						id: number;
						conteudo: string;
						dataEnvio: string;
						lida: boolean;
						remetente: {
							id: number;
							nome: string;
						};
					} | null;
				}>
			>("chat/listaConversas", {
				params: {
					IdProdutoMusical,
				},
			});

			// Ensure response is an array
			const conversationsData = Array.isArray(response) ? response : [];

			// Transform API response to Conversation format
			const transformedConversations: Array<Conversation> =
				conversationsData.map((item) => {
					// Transform last message if it exists
					let lastMessage: Message | undefined;
					if (item.ultimaMensagem) {
						lastMessage = {
							id: item.ultimaMensagem.id?.toString() || "0",
							conversationId: item.idConversa.toString(),
							senderId: item.ultimaMensagem.remetente?.id?.toString() || "0",
							receiverId: "0", // Not provided by this endpoint
							content: item.ultimaMensagem.conteudo || "",
							type: "text" as const,
							status: item.ultimaMensagem.lida
								? ("read" as const)
								: ("delivered" as const),
							createdAt:
								item.ultimaMensagem.dataEnvio || new Date().toISOString(),
							updatedAt:
								item.ultimaMensagem.dataEnvio || new Date().toISOString(),
							metadata: {
								senderName: item.ultimaMensagem.remetente?.nome || "Usuário",
							},
						};
					}

					// Build conversation object
					return {
						id: item.idConversa.toString(),
						participants: [item.contratante.nome, item.produtoMusical.nome],
						lastMessage: lastMessage,
						unreadCount: 0, // This endpoint doesn't provide unread count
						createdAt: lastMessage?.createdAt || new Date().toISOString(),
						updatedAt: lastMessage?.updatedAt || new Date().toISOString(),
						metadata: {
							participantId: item.produtoMusical.id,
							participantName: item.produtoMusical.nome,
							contratanteId: item.contratante.id,
							contratanteNome: item.contratante.nome,
						},
					};
				});

			// Populate conversations with full message history
			// Fetch messages for each conversation to ensure they have complete message data
			const conversationsWithMessages = await Promise.all(
				transformedConversations.map(async (conversation) => {
					try {
						// Get all messages for this conversation
						const messagesResponse = await this.getConversationMessages(
							parseInt(conversation.id, 10),
							{ page: 1, limit: 100 } // Get up to 100 messages per conversation
						);

						// Update conversation with messages if we got them
						if (messagesResponse.data && messagesResponse.data.length > 0) {
							// Sort messages by creation date to ensure proper order
							const sortedMessages = messagesResponse.data.sort(
								(a, b) =>
									new Date(a.createdAt).getTime() -
									new Date(b.createdAt).getTime()
							);

							// Update last message if we have messages
							const lastMessage = sortedMessages[sortedMessages.length - 1];

							return {
								...conversation,
								lastMessage: lastMessage || conversation.lastMessage,
								updatedAt: lastMessage?.updatedAt || conversation.updatedAt,
								metadata: {
									...conversation.metadata,
									messages: sortedMessages,
									totalMessages: sortedMessages.length,
								},
							};
						}

						// Return conversation as-is if no messages were found
						return conversation;
					} catch (error) {
						console.warn(
							`Failed to fetch messages for conversation ${conversation.id}:`,
							error
						);
						// Return conversation without messages if fetching fails
						return conversation;
					}
				})
			);

			// Apply client-side pagination if needed
			const page = parameters?.page || 1;
			const limit = parameters?.limit || 10;
			const startIndex = (page - 1) * limit;
			const endIndex = startIndex + limit;

			const paginatedData = conversationsWithMessages.slice(
				startIndex,
				endIndex
			);
			const totalItems = conversationsWithMessages.length;
			const totalPages = Math.ceil(totalItems / limit);

			return {
				data: paginatedData,
				pagination: {
					currentPage: page,
					totalPages,
					totalItems,
					itemsPerPage: limit,
					hasNextPage: page < totalPages,
					hasPreviousPage: page > 1,
				},
			};
		} catch (error) {
			console.error("Error fetching conversations:", error);
			// Return empty list on error
			return {
				data: [],
				pagination: {
					currentPage: 1,
					totalPages: 0,
					totalItems: 0,
					itemsPerPage: parameters?.limit || 10,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};
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
		assunto: string,
		conteudo: string
	): Promise<Conversation> {
		// First, get or create conversation with the product
		// API returns conversation ID directly as a number
		const conversationId = await this.apiClient.post<number>("chat/obter", {
			IdProdutoMusical: participanteId,
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
			Conteudo: `${assunto}: ${conteudo}`,
		});

		// Return a minimal conversation object for compatibility
		return {
			id: conversationId.toString(),
			participants: [],
			unreadCount: 0,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			metadata: {
				participantId: participanteId,
				assunto: assunto,
			},
		};
	}

	/**
	 * Get conversation messages
	 * Uses the correct Vibratto API endpoint GET /chat/{id}
	 */
	public async getConversationMessages(
		conversationId: number,
		parameters?: PaginationParameters
	): Promise<PaginatedResponse<Message>> {
		try {
			// Use the correct Vibratto API endpoint
			const response = await this.apiClient.get<Array<any>>(
				`chat/${conversationId}`
			);

			// Ensure response is an array
			const messages = Array.isArray(response) ? response : [];

			// Transform API response to Message format
			const transformedMessages: Array<Message> = messages.map(
				(message: any) => ({
					id: message.id?.toString() || "0",
					conversationId:
						message.idConversa?.toString() || conversationId.toString(),
					senderId: message.remetente?.id?.toString() || "0",
					receiverId: "0", // Not provided by this endpoint
					content: message.conteudo || "",
					type: "text" as const,
					status: message.lida ? ("read" as const) : ("delivered" as const),
					createdAt: message.dataEnvio || new Date().toISOString(),
					updatedAt: message.dataEnvio || new Date().toISOString(),
					metadata: {
						senderName: message.remetente?.nome || "Usuário",
					},
				})
			);

			// Apply basic pagination (since API doesn't support it yet)
			const page = parameters?.page || 1;
			const limit = parameters?.limit || 20;
			const startIndex = (page - 1) * limit;
			const endIndex = startIndex + limit;

			const paginatedMessages = transformedMessages.slice(startIndex, endIndex);
			const totalItems = transformedMessages.length;
			const totalPages = Math.ceil(totalItems / limit);

			return {
				data: paginatedMessages,
				pagination: {
					currentPage: page,
					totalPages,
					totalItems,
					itemsPerPage: limit,
					hasNextPage: page < totalPages,
					hasPreviousPage: page > 1,
				},
			};
		} catch (error) {
			console.error("Error fetching conversation messages:", error);
			// Return empty response on error
			return {
				data: [],
				pagination: {
					currentPage: 1,
					totalPages: 0,
					totalItems: 0,
					itemsPerPage: parameters?.limit || 20,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};
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

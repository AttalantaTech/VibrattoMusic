import { api as apiClient } from "../../api";
import { chatWebSocketService } from "../websocket/chatWebSocketService";
import type { SignalRMessage } from "../../api/types";

// Re-export SignalRMessage for backward compatibility
export type { SignalRMessage };

export interface ConversaRequest {
	idContratante: number;
	idContratado: number;
}

export interface ConversaResponse {
	idConversa: number;
}

export class ChatSignalRService {
	private currentConversaId: number | null = null;
	private readonly messageHandlers: Map<string, (message: SignalRMessage) => void> =
		new Map();
	private readonly notificationHandlers: Map<string, (message: string) => void> =
		new Map();
	private readonly readHandlers: Map<string, (messageId: number) => void> = new Map();

	private static instance: ChatSignalRService | null = null;

	private constructor() {}

	public static getInstance(): ChatSignalRService {
		if (!ChatSignalRService.instance) {
			ChatSignalRService.instance = new ChatSignalRService();
		}
		return ChatSignalRService.instance;
	}

	/**
	 * Criar ou obter uma conversa via REST API Vibratto
	 */
	public async iniciarConversa(
		_idContratante: number,
		idContratado: number
	): Promise<number> {
		try {
			// Use the correct Vibratto API endpoint with IdProdutoMusical
			// For now, assume idContratado is the IdProdutoMusical
			const conversationId = await apiClient.post<number>("chat/obter", {
				IdProdutoMusical: idContratado,
			});

			return conversationId;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Erro ao criar conversa";
			throw new Error(errorMessage);
		}
	}

	/**
	 * Conectar ao WebSocket (replaces SignalR)
	 */
	public async connect(): Promise<void> {
		// Use WebSocket service instead of SignalR
		console.log("🔌 Connecting via WebSocket service");
		const token = this.getAuthToken();
		const userId = this.getUserIdFromToken(token);
		
		if (userId) {
			await chatWebSocketService.initialize(userId, token);
		}
		return;
	}

	/**
	 * Entrar em uma conversa específica via WebSocket
	 */
	public async entrarConversa(idConversa: number): Promise<void> {
		// Use WebSocket service to join conversation
		if (chatWebSocketService.isConnected()) {
			await chatWebSocketService.joinConversation(idConversa);
			this.currentConversaId = idConversa;
			console.log("✅ Joined conversation via WebSocket:", idConversa);
		} else {
			console.log("⚠️ WebSocket not connected, skipping conversation entry");
		}
		return;
	}

	/**
	 * Enviar mensagem via WebSocket (with REST fallback)
	 */
	public async enviarMensagem(
		idConversa: number,
		conteudo: string
	): Promise<void> {
		// Try WebSocket first, fallback to REST if not connected
		if (chatWebSocketService.isConnected()) {
			await chatWebSocketService.sendMessage(idConversa, conteudo);
		} else {
			await this.enviarMensagemViaAPI(idConversa, conteudo);
		}
	}

	/**
	 * Enviar mensagem via API REST Vibratto
	 */
	public async enviarMensagemViaAPI(
		idConversa: number,
		conteudo: string
	): Promise<void> {
		console.log('🌐 API Call - Sending message:', { endpoint: 'POST /chat/mensagem', IdConversa: idConversa, Conteudo: conteudo });
		try {
			const response = await apiClient.post("chat/mensagem", {
				IdConversa: idConversa,
				Conteudo: conteudo,
			});
			console.log('✅ API Call - Message sent successfully:', response);
		} catch (error) {
			console.error('❌ API Call - Error sending message:', error);
			const errorMessage = error instanceof Error ? error.message : "Erro ao enviar mensagem";
			throw new Error(errorMessage);
		}
	}

	/**
	 * Marcar mensagem como lida via WebSocket (with REST fallback)
	 */
	public async marcarMensagemComoLida(idMensagem: number): Promise<void> {
		// Try WebSocket first, fallback to REST if not connected
		if (chatWebSocketService.isConnected()) {
			chatWebSocketService.markMessageAsRead(idMensagem);
		} else {
			await this.marcarComoLidaViaAPI(idMensagem);
		}
	}

	/**
	 * Marcar mensagem como lida via API REST Vibratto
	 */
	public async marcarComoLidaViaAPI(idMensagem: number): Promise<void> {
		try {
			await apiClient.post(`chat/lida/${idMensagem}`, {});
		} catch (error) {
			// Don't propagate error to not interrupt UX
			console.warn("Failed to mark message as read:", error);
		}
	}

	/**
	 * Carregar histórico de mensagens via API Vibratto
	 */
	public async carregarHistorico(
		idConversa: number
	): Promise<Array<SignalRMessage>> {
		console.log('🌐 API Call - Loading history:', { endpoint: `GET /chat/${idConversa}` });
		try {
			// Use the correct Vibratto API endpoint GET /chat/{id} with cache busting
			const timestamp = Date.now();
			const mensagens = await apiClient.get<Array<any>>(`chat/${idConversa}?_t=${timestamp}`);
			console.log('📥 API Response - Raw messages:', mensagens.length, 'messages received');
			
			// Map the API response to SignalRMessage format and sort chronologically
			const mappedMessages = mensagens.map((msg) => ({
				id: msg.id,
				idConversa: msg.idConversa,
				idRemetente: msg.remetente?.id || 0,
				nomeRemetente: msg.remetente?.nome || "Usuário",
				conteudo: msg.conteudo,
				dataEnvio: msg.dataEnvio,
				lida: msg.lida || false,
			}));
			
			// Sort messages chronologically (oldest first, newest last)
			const sortedMessages = mappedMessages.sort((a, b) => {
				const dateA = new Date(a.dataEnvio).getTime();
				const dateB = new Date(b.dataEnvio).getTime();
				return dateA - dateB;
			});
			
			const lastMsg = sortedMessages[sortedMessages.length - 1];
			console.log('📋 API Response - Processed messages:', {
				total: sortedMessages.length,
				lastMessage: lastMsg ? {
					id: lastMsg.id,
					content: lastMsg.conteudo,
					timestamp: lastMsg.dataEnvio
				} : null
			});
			
			return sortedMessages;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Erro ao carregar histórico de mensagens";
			throw new Error(errorMessage);
		}
	}

	/**
	 * Registrar handler para novas mensagens
	 */
	public onMessage(
		id: string,
		handler: (message: SignalRMessage) => void
	): void {
		this.messageHandlers.set(id, handler);
	}

	/**
	 * Remover handler de mensagens
	 */
	public offMessage(id: string): void {
		this.messageHandlers.delete(id);
	}

	/**
	 * Registrar handler para notificações
	 */
	public onNotification(id: string, handler: (message: string) => void): void {
		this.notificationHandlers.set(id, handler);
	}

	/**
	 * Remover handler de notificações
	 */
	public offNotification(id: string): void {
		this.notificationHandlers.delete(id);
	}

	/**
	 * Registrar handler para mensagens lidas
	 */
	public onMessageRead(id: string, handler: (messageId: number) => void): void {
		this.readHandlers.set(id, handler);
	}

	/**
	 * Remover handler de mensagens lidas
	 */
	public offMessageRead(id: string): void {
		this.readHandlers.delete(id);
	}

	/**
	 * Desconectar do WebSocket
	 */
	public async disconnect(): Promise<void> {
		// Disconnect WebSocket
		chatWebSocketService.disconnect();
		
		// Clear local state
		this.currentConversaId = null;
		this.messageHandlers.clear();
		this.notificationHandlers.clear();
		this.readHandlers.clear();
	}

	/**
	 * Verificar se está conectado via WebSocket
	 */
	public isConnected(): boolean {
		return chatWebSocketService.isConnected();
	}

	/**
	 * Obter ID da conversa atual
	 */
	public getCurrentConversaId(): number | null {
		return this.currentConversaId;
	}


	private getAuthToken(): string {
		// Primeiro tenta pegar do localStorage (compatível com Zustand)
		try {
			const authState = localStorage.getItem("vibratto-auth");
			if (authState) {
				try {
					// Tenta parsear como JSON (formato Zustand)
					const parsedState = JSON.parse(authState) as { state?: { token?: string } };
					if (parsedState?.state?.token) {
						return parsedState.state.token;
					}
				} catch {
					// Se não conseguir parsear como JSON, assume que é um token raw
					return authState;
				}
			}
		} catch (error) {
			console.warn("❌ Error accessing localStorage:", error);
		}

		// Tenta outros formatos de localStorage
		const rawToken = localStorage.getItem("authToken");
		if (rawToken) {
			return rawToken;
		}

		const accessToken = localStorage.getItem("access_token");
		if (accessToken) {
			return accessToken;
		}

		// Fallback para cookie (compatível com authSync)
		const cookies = document.cookie.split(";");
		for (const cookie of cookies) {
			const [name, value] = cookie.trim().split("=");
			if ((name === "authToken" || name === "access_token") && value) {
				return decodeURIComponent(value);
			}
		}

		throw new Error("Token de autenticação não encontrado");
	}

	private getUserIdFromToken(token: string): string | null {
		try {
			const tokenParts = token.split('.');
			if (tokenParts.length !== 3) return null;

			const payloadStr = tokenParts[1];
			if (!payloadStr) return null;

			const payload = JSON.parse(atob(payloadStr)) as {
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
				payload.unique_name
			];

			for (const id of possibleIds) {
				if (id) {
					return String(id);
				}
			}

			return null;
		} catch (error) {
			console.warn("⚠️ Could not extract user ID from token:", error);
			return null;
		}
	}
}

// Export singleton instance
export const chatSignalRService = ChatSignalRService.getInstance();

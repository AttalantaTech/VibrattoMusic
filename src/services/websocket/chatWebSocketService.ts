import { getWebSocketService } from "../../api/websocket/client";
import type { SignalRMessage } from "../../api/types";
import { api as apiClient } from "../../api";
import { VibrattoWebSocketService } from "@/api/websocket/vibrattoWebSocketService";

export interface ChatWebSocketEvents {
	onMessageReceived: (message: SignalRMessage) => void;
	onMessageRead: (messageId: number) => void;
	onTyping: (userId: number, conversationId: number) => void;
	onUserStatusChanged: (userId: number, status: "online" | "offline") => void;
	connectionStatusChanged: (isConnected: boolean) => void;
	error: (error: Error) => void;
}

export class ChatWebSocketService {
	private webSocketService: VibrattoWebSocketService | null = null;
	private currentConversationId: number | null = null;
	private eventHandlers: Map<string, Array<(data: any) => void>> = new Map();
	private isInitialized = false;
	private reconnectAttempts = 0;
	private messageQueue: Array<{ conversationId: number; content: string }> = [];

	// Debug mode
	private debugMode = false;
	private debugLog: Array<{
		timestamp: string;
		type: string;
		message: string;
		data?: any;
	}> = [];
	private maxDebugLogSize = 100;

	private static instance: ChatWebSocketService | null = null;

	private constructor() {}

	public static getInstance(): ChatWebSocketService {
		if (!ChatWebSocketService.instance) {
			ChatWebSocketService.instance = new ChatWebSocketService();
		}
		return ChatWebSocketService.instance;
	}

	/**
	 * Initialize WebSocket connection for chat
	 */
	public async initialize(userId: string, authToken: string): Promise<void> {
		if (this.isInitialized && this.webSocketService?.isConnected()) {
			console.log("✅ WebSocket already initialized and connected");
			this.addDebugLog("info", "Already initialized and connected");
			return;
		}

		this.addDebugLog("connection", `Initializing WebSocket for user ${userId}`);

		try {
			this.webSocketService = getWebSocketService({
				url: "chatHub",
				reconnectInterval: 5000,
				maxReconnectAttempts: 10,
				heartbeatInterval: 30000,
				enableHeartbeat: true,
			});

			// Setup event listeners before connecting
			this.setupWebSocketEventHandlers();

			// Try to initialize WebSocket connection
			try {
				await this.webSocketService.initialize(userId, authToken);
				this.isInitialized = true;
				this.reconnectAttempts = 0;
				console.log("✅ WebSocket chat service initialized successfully");
				this.addDebugLog("success", "WebSocket initialized successfully");

				// Process any queued messages
				await this.processMessageQueue();

				// Notify handlers of connection status
				this.emitEvent("connectionStatusChanged", true);
			} catch (wsError) {
				// WebSocket not available, continue in REST-only mode
				console.log(
					"📵 WebSocket not available, using REST-only mode for chat"
				);
				this.addDebugLog(
					"info",
					"WebSocket not available, using REST fallback"
				);
				this.isInitialized = true; // Mark as initialized even in REST-only mode
				this.emitEvent("connectionStatusChanged", false);
				// Don't emit error for expected WebSocket unavailability
				// Only emit error if it's not an expected "not available" error
				const errorMessage =
					wsError instanceof Error ? wsError.message : String(wsError);
				if (!errorMessage.includes("WebSocket not available")) {
					this.emitEvent(
						"error",
						wsError instanceof Error
							? wsError
							: new Error("WebSocket initialization failed")
					);
				}
				// Don't throw - we can still use REST API
			}
		} catch (error) {
			console.error("❌ Failed to initialize chat service:", error);
			this.emitEvent(
				"error",
				error instanceof Error
					? error
					: new Error("Chat service initialization failed")
			);
			// Don't throw - allow REST fallback
		}
	}

	/**
	 * Join a conversation for real-time updates
	 */
	public async joinConversation(conversationId: number): Promise<void> {
		if (!this.webSocketService) {
			throw new Error("WebSocket service not initialized");
		}

		// Leave previous conversation if any
		if (
			this.currentConversationId &&
			this.currentConversationId !== conversationId
		) {
			this.leaveConversation(this.currentConversationId);
		}

		this.currentConversationId = conversationId;
		this.webSocketService.joinConversation(String(conversationId));
		console.log(`✅ Joined conversation: ${conversationId}`);
	}

	/**
	 * Leave a conversation
	 */
	public leaveConversation(conversationId: number): void {
		if (!this.webSocketService) {
			return;
		}

		this.webSocketService.leaveConversation(String(conversationId));
		if (this.currentConversationId === conversationId) {
			this.currentConversationId = null;
		}
		console.log(`👋 Left conversation: ${conversationId}`);
	}

	/**
	 * Send a message via WebSocket
	 */
	public async sendMessage(
		conversationId: number,
		content: string
	): Promise<void> {
		this.addDebugLog(
			"send",
			`Sending message to conversation ${conversationId}`,
			{ content }
		);

		// If WebSocket is not connected, queue the message and use REST API
		if (!this.webSocketService?.isConnected()) {
			console.warn(
				"⚠️ WebSocket not connected, queueing message and using REST API"
			);
			this.addDebugLog("queue", "Message queued, using REST API fallback");
			this.messageQueue.push({ conversationId, content });

			// Fallback to REST API
			await this.sendMessageViaREST(conversationId, content);
			return;
		}

		try {
			// Send via WebSocket
			this.webSocketService.sendMessage(
				String(conversationId),
				content,
				"text"
			);
			console.log(
				`📤 Message sent via WebSocket to conversation ${conversationId}`
			);
			this.addDebugLog("success", "Message sent via WebSocket");
		} catch (error) {
			console.error(
				"❌ Failed to send message via WebSocket, falling back to REST:",
				error
			);
			this.addDebugLog("error", "WebSocket send failed, using REST fallback", {
				error,
			});

			// Fallback to REST API
			await this.sendMessageViaREST(conversationId, content);
		}
	}

	/**
	 * Send message via REST API (fallback)
	 */
	private async sendMessageViaREST(
		conversationId: number,
		content: string
	): Promise<void> {
		try {
			await apiClient.post("chat/mensagem", {
				IdConversa: conversationId,
				Conteudo: content,
			});
			console.log("✅ Message sent via REST API");
		} catch (error) {
			console.error("❌ Failed to send message via REST API:", error);
			throw error;
		}
	}

	/**
	 * Mark a message as read
	 */
	public markMessageAsRead(messageId: number): void {
		if (!this.webSocketService?.isConnected()) {
			// Fallback to REST API
			this.markAsReadViaREST(messageId);
			return;
		}

		this.webSocketService.markMessageAsRead(String(messageId));
		console.log(`✅ Message ${messageId} marked as read via WebSocket`);
	}

	/**
	 * Mark message as read via REST API (fallback)
	 */
	private async markAsReadViaREST(messageId: number): Promise<void> {
		try {
			await apiClient.post(`chat/lida/${messageId}`, {});
			console.log(`✅ Message ${messageId} marked as read via REST API`);
		} catch (error) {
			console.warn("Failed to mark message as read:", error);
		}
	}

	/**
	 * Send typing indicator
	 */
	public sendTypingIndicator(conversationId: number): void {
		if (!this.webSocketService?.isConnected()) {
			return;
		}

		this.webSocketService.sendMessage(
			String(conversationId),
			"",
			"typing" as any
		);
	}

	/**
	 * Update user status
	 */
	public updateUserStatus(
		status: "online" | "away" | "busy" | "offline"
	): void {
		if (!this.webSocketService) {
			return;
		}

		this.webSocketService.updateStatus(status);
	}

	/**
	 * Check if WebSocket is connected
	 */
	public isConnected(): boolean {
		return this.webSocketService?.isConnected() || false;
	}

	/**
	 * Disconnect WebSocket
	 */
	public disconnect(): void {
		if (this.currentConversationId) {
			this.leaveConversation(this.currentConversationId);
		}

		if (this.webSocketService) {
			// Remove all event listeners
			this.removeWebSocketEventHandlers();

			this.webSocketService.disconnect();
			this.webSocketService = null;
		}

		this.isInitialized = false;
		this.currentConversationId = null;
		this.messageQueue = [];
		this.eventHandlers.clear();

		console.log("👋 WebSocket chat service disconnected");
	}

	/**
	 * Register event handler
	 */
	public on(
		event: keyof ChatWebSocketEvents,
		handler: (data: any) => void
	): void {
		const handlers = this.eventHandlers.get(event) || [];
		handlers.push(handler);
		this.eventHandlers.set(event, handlers);
	}

	/**
	 * Unregister event handler
	 */
	public off(
		event: keyof ChatWebSocketEvents,
		handler: (data: any) => void
	): void {
		const handlers = this.eventHandlers.get(event) || [];
		const index = handlers.indexOf(handler);
		if (index > -1) {
			handlers.splice(index, 1);
			this.eventHandlers.set(event, handlers);
		}
	}

	/**
	 * Setup WebSocket event handlers
	 */
	private setupWebSocketEventHandlers(): void {
		if (!this.webSocketService) return;

		// Handle incoming messages
		this.webSocketService.on("messageReceived", (data: any) => {
			const message: SignalRMessage = {
				id: data.id || data.messageId,
				idConversa: data.conversationId || this.currentConversationId || 0,
				idRemetente: data.senderId || data.remetente?.id || 0,
				nomeRemetente: data.senderName || data.remetente?.nome || "Usuário",
				conteudo: data.content || data.conteudo || "",
				dataEnvio: data.timestamp || data.dataEnvio || new Date().toISOString(),
				lida: data.isRead || data.lida || false,
			};

			console.log("📨 Message received via WebSocket:", message);
			this.emitEvent("onMessageReceived", message);
		});

		// Handle message read status updates
		this.webSocketService.on("message" as any, (data: any) => {
			if (data.type === "message.read") {
				const messageId = data.data?.messageId || data.data?.id;
				if (messageId) {
					console.log(`✅ Message ${messageId} marked as read`);
					this.emitEvent("onMessageRead", Number(messageId));
				}
			}

			// Handle typing indicators
			if (data.type === "user.typing") {
				const userId = data.data?.userId;
				const conversationId = data.data?.conversationId;
				if (userId && conversationId) {
					this.emitEvent("onTyping", { userId, conversationId });
				}
			}
		});

		// Handle user status changes
		this.webSocketService.on("userStatusChanged", (data: any) => {
			const userId = data.userId || data.id;
			const status = data.status || (data.isOnline ? "online" : "offline");
			if (userId) {
				this.emitEvent("onUserStatusChanged", { userId, status });
			}
		});

		// Handle connection status changes
		this.webSocketService.on("connected", () => {
			console.log("✅ WebSocket connected");
			this.reconnectAttempts = 0;
			this.emitEvent("connectionStatusChanged", true);

			// Process queued messages
			this.processMessageQueue();
		});

		this.webSocketService.on("disconnected", () => {
			console.log("❌ WebSocket disconnected");
			this.emitEvent("connectionStatusChanged", false);
		});

		this.webSocketService.on("error", (error: any) => {
			console.error("❌ WebSocket error:", error);
			this.emitEvent(
				"error",
				error instanceof Error ? error : new Error("WebSocket error")
			);
		});

		this.webSocketService.on("reconnecting", () => {
			this.reconnectAttempts++;
			console.log(
				`🔄 WebSocket reconnecting... (attempt ${this.reconnectAttempts})`
			);
		});

		this.webSocketService.on("reconnected", () => {
			console.log("✅ WebSocket reconnected successfully");
			this.reconnectAttempts = 0;
			this.emitEvent("connectionStatusChanged", true);

			// Rejoin current conversation if any
			if (this.currentConversationId) {
				this.joinConversation(this.currentConversationId);
			}

			// Process queued messages
			this.processMessageQueue();
		});
	}

	/**
	 * Remove WebSocket event handlers
	 */
	private removeWebSocketEventHandlers(): void {
		if (!this.webSocketService) return;

		// Remove all event listeners
		const events = [
			"messageReceived",
			"message",
			"userStatusChanged",
			"connected",
			"disconnected",
			"error",
			"reconnecting",
			"reconnected",
		];

		for (const event of events) {
			this.webSocketService.off(event as any, () => {});
		}
	}

	/**
	 * Process queued messages
	 */
	private async processMessageQueue(): Promise<void> {
		if (
			this.messageQueue.length === 0 ||
			!this.webSocketService?.isConnected()
		) {
			return;
		}

		console.log(`📤 Processing ${this.messageQueue.length} queued messages`);

		const queue = [...this.messageQueue];
		this.messageQueue = [];

		for (const { conversationId, content } of queue) {
			try {
				await this.sendMessage(conversationId, content);
			} catch (error) {
				console.error("Failed to send queued message:", error);
				// Re-queue the message if it fails
				this.messageQueue.push({ conversationId, content });
			}
		}
	}

	/**
	 * Emit event to registered handlers
	 */
	private emitEvent(event: string, data?: any): void {
		this.addDebugLog("info", `Emitting event: ${event}`, data);
		const handlers = this.eventHandlers.get(event) || [];
		for (const handler of handlers) {
			try {
				handler(data);
			} catch (error) {
				console.error(`Error in event handler for ${event}:`, error);
				this.addDebugLog("error", `Error in event handler for ${event}`, {
					error,
				});
			}
		}
	}

	/**
	 * Load message history via REST API
	 */
	public async loadMessageHistory(
		conversationId: number
	): Promise<Array<SignalRMessage>> {
		try {
			const timestamp = Date.now();
			const messages = await apiClient.get<Array<any>>(
				`chat/${conversationId}?_t=${timestamp}`
			);

			// Map the API response to SignalRMessage format
			const mappedMessages = messages.map((msg) => ({
				id: msg.id,
				idConversa: msg.idConversa,
				idRemetente: msg.idRemetente || 0,
				nomeRemetente: msg.nomeRemetente || "Usuário",
				conteudo: msg.conteudo,
				dataEnvio: msg.dataEnvio,
				lida: msg.lida || false,
			}));

			// Sort messages chronologically
			return mappedMessages.sort((a, b) => {
				const dateA = new Date(a.dataEnvio).getTime();
				const dateB = new Date(b.dataEnvio).getTime();
				return dateA - dateB;
			});
		} catch (error) {
			console.error("Failed to load message history:", error);
			throw error;
		}
	}

	/**
	 * Create or get a conversation
	 */
	public async iniciarConversa(
		_idContratante: number,
		idContratado: number
	): Promise<number> {
		try {
			const conversationId = await apiClient.post<number>("chat/obter", {
				IdProdutoMusical: idContratado,
			});
			return conversationId;
		} catch (error) {
			console.error("Failed to create/get conversation:", error);
			throw error;
		}
	}

	/**
	 * Enable or disable debug mode
	 */
	public setDebugMode(enabled: boolean): void {
		this.debugMode = enabled;
		if (enabled) {
			console.log("🐛 WebSocket Debug Mode ENABLED");
			console.log(
				"Debug logs will be collected. Use getDebugLog() to retrieve."
			);
		} else {
			console.log("🐛 WebSocket Debug Mode DISABLED");
		}
	}

	/**
	 * Get debug mode status
	 */
	public isDebugMode(): boolean {
		return this.debugMode;
	}

	/**
	 * Add entry to debug log
	 */
	private addDebugLog(type: string, message: string, data?: any): void {
		if (!this.debugMode) return;

		const entry = {
			timestamp: new Date().toISOString(),
			type,
			message,
			data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep clone to avoid reference issues
		};

		this.debugLog.push(entry);

		// Keep log size manageable
		if (this.debugLog.length > this.maxDebugLogSize) {
			this.debugLog.shift();
		}

		// Also log to console in debug mode
		const emoji = this.getDebugEmoji(type);
		console.log(`${emoji} [${type}] ${message}`, data || "");
	}

	/**
	 * Get emoji for debug log type
	 */
	private getDebugEmoji(type: string): string {
		const emojiMap: Record<string, string> = {
			connection: "🔌",
			message: "💬",
			error: "❌",
			warning: "⚠️",
			info: "ℹ️",
			success: "✅",
			send: "📤",
			receive: "📥",
			queue: "📦",
			conversation: "🗨️",
		};
		return emojiMap[type] || "📝";
	}

	/**
	 * Get debug log
	 */
	public getDebugLog(): Array<{
		timestamp: string;
		type: string;
		message: string;
		data?: any;
	}> {
		return [...this.debugLog];
	}

	/**
	 * Clear debug log
	 */
	public clearDebugLog(): void {
		this.debugLog = [];
		console.log("🧹 Debug log cleared");
	}

	/**
	 * Get current status summary
	 */
	public getStatus(): {
		initialized: boolean;
		connected: boolean;
		currentConversation: number | null;
		queuedMessages: number;
		reconnectAttempts: number;
		mode: "websocket" | "rest" | "disconnected";
	} {
		const connected = this.webSocketService?.isConnected() || false;
		return {
			initialized: this.isInitialized,
			connected,
			currentConversation: this.currentConversationId,
			queuedMessages: this.messageQueue.length,
			reconnectAttempts: this.reconnectAttempts,
			mode: connected
				? "websocket"
				: this.isInitialized
					? "rest"
					: "disconnected",
		};
	}

	/**
	 * Print status to console
	 */
	public printStatus(): void {
		const status = this.getStatus();
		console.log("🔍 WebSocket Chat Service Status");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log(`📊 Mode: ${status.mode.toUpperCase()}`);
		console.log(`🔌 Initialized: ${status.initialized ? "Yes" : "No"}`);
		console.log(`📡 Connected: ${status.connected ? "Yes" : "No"}`);
		console.log(
			`🗨️  Current Conversation: ${status.currentConversation || "None"}`
		);
		console.log(`📦 Queued Messages: ${status.queuedMessages}`);
		console.log(`🔄 Reconnect Attempts: ${status.reconnectAttempts}`);
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	}
}

// Export singleton instance
export const chatWebSocketService = ChatWebSocketService.getInstance();

// Add to window for debugging in browser console
if (
	typeof window !== "undefined" &&
	process.env["NODE_ENV"] === "development"
) {
	(window as any).chatWebSocketService = chatWebSocketService;
	(window as any).wsDebug = {
		enable: () => chatWebSocketService.setDebugMode(true),
		disable: () => chatWebSocketService.setDebugMode(false),
		status: () => chatWebSocketService.printStatus(),
		log: () => chatWebSocketService.getDebugLog(),
		clear: () => chatWebSocketService.clearDebugLog(),
	};

	console.log("💡 WebSocket debugging available in console:");
	console.log("   wsDebug.enable()  - Enable debug mode");
	console.log("   wsDebug.disable() - Disable debug mode");
	console.log("   wsDebug.status()  - Show current status");
	console.log("   wsDebug.log()     - Get debug log");
	console.log("   wsDebug.clear()   - Clear debug log");
}

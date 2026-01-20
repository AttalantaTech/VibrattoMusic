import { WebSocketClient, WebSocketConfig, WebSocketEventType } from "./client";

/**
 * High-level WebSocket service for Vibratto features
 */
export class VibrattoWebSocketService {
	private readonly client: WebSocketClient;
	private currentUserId: string | null = null;

	public constructor(config?: Partial<WebSocketConfig>) {
		this.client = new WebSocketClient(config);
		this.setupEventHandlers();
	}

	/**
	 * Initialize WebSocket connection for a user
	 */
	public async initialize(userId: string, authToken: string): Promise<void> {
		this.currentUserId = userId;

		try {
			await this.client.connect(authToken);
			console.log("isConnected", this.client.isConnected());

			// Only subscribe if connected
			if (this.client.isConnected()) {
				// Subscribe to user-specific channels
				this.client.subscribeToNotifications(userId);
				this.client.subscribeToBookingUpdates(userId);
				this.client.updateUserStatus("online");
			}
		} catch (error) {
			// WebSocket unavailability is expected and handled gracefully
			// Don't re-throw - allow application to continue without WebSocket
		}
	}

	/**
	 * Disconnect WebSocket
	 */
	public disconnect(): void {
		if (this.currentUserId) {
			this.client.updateUserStatus("offline");
		}
		this.client.disconnect();
		this.currentUserId = null;
	}

	/**
	 * Join a conversation for real-time messaging
	 */
	public joinConversation(conversationId: string): void {
		this.client.joinConversation(conversationId);
	}

	/**
	 * Leave a conversation
	 */
	public leaveConversation(conversationId: string): void {
		this.client.leaveConversation(conversationId);
	}

	/**
	 * Send a message in a conversation
	 */
	public sendMessage(
		conversationId: string,
		content: string,
		type: "text" | "image" | "audio" = "text"
	): void {
		this.client.sendMessage(conversationId, content, type);
	}

	/**
	 * Mark message as read
	 */
	public markMessageAsRead(messageId: string): void {
		this.client.markMessageAsRead(messageId);
	}

	/**
	 * Update user status
	 */
	public updateStatus(status: "online" | "away" | "busy" | "offline"): void {
		this.client.updateUserStatus(status);
	}

	/**
	 * Subscribe to events
	 */
	public on(
		event: WebSocketEventType,
		listener: (...args: Array<unknown>) => void
	): void {
		this.client.on(event, listener);
	}

	/**
	 * Unsubscribe from events
	 */
	public off(
		event: WebSocketEventType,
		listener: (...args: Array<unknown>) => void
	): void {
		this.client.off(event, listener);
	}

	/**
	 * Check if connected
	 */
	public isConnected(): boolean {
		return this.client.isConnected();
	}

	/**
	 * Get connection state
	 */
	public getConnectionState(): string {
		return this.client.getState();
	}

	private setupEventHandlers(): void {
		this.client.on("disconnected", () => {
			// Handle disconnection, maybe show notification to user
		});

		this.client.on("error", (error) => {
			console.error("WebSocket error:", error);
		});

		this.client.on("reconnecting", () => {});

		this.client.on("reconnected", () => {
			// WebSocket reconnected successfully
		});
	}
}

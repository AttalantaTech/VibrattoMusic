/**
 * WebSocket integration for real-time features in Vibratto API
 */

import { getEnvironmentConfig } from "../config/environment";
import type {
	Message,
	BookingUpdate,
	NotificationData,
	UserStatus,
	ConversationUpdate,
} from "../types";
import { VibrattoWebSocketService } from "./vibrattoWebSocketService";

// Minimal EventEmitter for browser compatibility
class BrowserEventEmitter {
	private listeners: Record<string, Array<(arg: unknown) => void>> = {};

	public on(event: string, listener: (arg: unknown) => void): this {
		(this.listeners[event] ??= []).push(listener);
		return this;
	}

	public off(event: string, listener: (arg: unknown) => void): this {
		if (!this.listeners[event]) return this;
		this.listeners[event] = this.listeners[event].filter((l) => l !== listener);
		return this;
	}

	public emit(event: string, arg?: unknown): boolean {
		if (!this.listeners[event]) return false;
		this.listeners[event].forEach((listener) => {
			listener(arg);
		});
		return true;
	}
}

export interface WebSocketMessage {
	type: string;
	data: unknown;
	timestamp?: string; // Made optional since it's added automatically by send method
	id?: string;
}

export interface WebSocketConfig {
	url: string;
	reconnectInterval: number;
	maxReconnectAttempts: number;
	heartbeatInterval: number;
	enableHeartbeat: boolean;
	protocols?: Array<string>;
}

export type WebSocketEventType =
	| "connected"
	| "disconnected"
	| "error"
	| "message"
	| "messageReceived"
	| "conversationUpdated"
	| "bookingUpdated"
	| "notificationReceived"
	| "userStatusChanged"
	| "reconnecting"
	| "reconnected"
	| "heartbeat";

export class WebSocketClient extends BrowserEventEmitter {
	private ws: WebSocket | null = null;
	private readonly config: WebSocketConfig;
	private reconnectAttempts = 0;
	private heartbeatTimer: NodeJS.Timeout | null = null;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private isConnecting = false;
	private isManualClose = false;
	private authToken: string | null = null;
	private readonly subscriptions = new Set<string>();
	private serverUnavailable = false; // Track if server is unavailable
	public constructor(config?: Partial<WebSocketConfig>) {
		super();

		const envConfig = getEnvironmentConfig();
		const baseUrl = envConfig.apiBaseUrl.replace(/^https/, "ws");
		const endpoint = config?.url || "chat/mensagem";

		this.config = {
			...config,
			reconnectInterval: 5000,
			maxReconnectAttempts: 10,
			heartbeatInterval: 30000,
			enableHeartbeat: true,
			url: `${baseUrl}/${endpoint}`,
		};

		return;
	}
	/**
	 * Connect to WebSocket server
	 */
	public async connect(authToken?: string): Promise<void> {
		if (
			this.isConnecting ||
			(this.ws && this.ws.readyState === WebSocket.OPEN)
		) {
			return;
		}

		this.isConnecting = true;
		this.isManualClose = false;
		this.authToken = authToken ?? this.authToken;

		try {
			const url = new URL(this.config.url);
			if (this.authToken) {
				url.searchParams.set("token", this.authToken);
			}

			// Check if WebSocket endpoint exists by trying to connect
			this.ws = new WebSocket(url.toString(), this.config.protocols);
			this.setupEventHandlers();

			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					if (this.ws) {
						this.ws.close();
						this.ws = null;
					}
					this.isConnecting = false;
					reject(
						new Error(
							"WebSocket connection timeout - server may not support WebSocket"
						)
					);
				}, 5000); // Reduced timeout to fail faster

				this.ws!.onopen = () => {
					clearTimeout(timeout);
					this.isConnecting = false;
					this.reconnectAttempts = 0;
					this.startHeartbeat();
					this.resubscribe();
					this.emit("connected");
					console.log("✅ WebSocket connected successfully");
					resolve();
				};
				this.ws!.onerror = (_error) => {
					clearTimeout(timeout);
					this.isConnecting = false;
					this.serverUnavailable = true; // Mark server as unavailable
					if (this.ws) {
						this.ws.close();
						this.ws = null;
					}
					// Don't log as error - WebSocket unavailability is expected and handled
					console.log("📵 WebSocket not available - using REST API mode");
					// Don't emit error event for expected connection failures
					// this.emit("error", error);
					reject(
						new Error("WebSocket not available - using REST API fallback")
					);
				};
			});
			return;
		} catch (error) {
			console.error(error);
			this.isConnecting = false;
			// Expected when WebSocket endpoint doesn't exist - not an error
			// Application will use REST API fallback
			return;
		}
	}
	/**
	 * Disconnect from WebSocket server
	 */
	public disconnect(): void {
		this.isManualClose = true;
		this.stopHeartbeat();
		this.clearReconnectTimer();

		if (this.ws) {
			this.ws.close(1000, "Manual disconnect");
			this.ws = null;
		}

		this.emit("disconnected");
	}
	/**
	 * Send message to server
	 */
	public send(message: WebSocketMessage): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new Error("WebSocket is not connected");
		}

		const messageWithId = {
			...message,
			id: message.id ?? this.generateId(),
			timestamp: new Date().toISOString(),
		};

		this.ws.send(JSON.stringify(messageWithId));
	}
	/**
	 * Subscribe to specific channels or topics
	 */
	public subscribe(channel: string): void {
		this.subscriptions.add(channel);

		if (this.isConnected()) {
			this.send({
				type: "subscribe",
				data: { channel },
			});
		}
	}
	/**
	 * Unsubscribe from channels or topics
	 */
	public unsubscribe(channel: string): void {
		this.subscriptions.delete(channel);

		if (this.isConnected()) {
			this.send({
				type: "unsubscribe",
				data: { channel },
			});
		}
	}
	/**
	 * Check if WebSocket is connected
	 */
	public isConnected(): boolean {
		console.log(this.ws);
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}

	/**
	 * Get connection state
	 */
	public getState(): string {
		if (!this.ws) return "closed";

		switch (this.ws.readyState) {
			case WebSocket.CONNECTING:
				return "connecting";
			case WebSocket.OPEN:
				return "open";
			case WebSocket.CLOSING:
				return "closing";
			case WebSocket.CLOSED:
				return "closed";
			default:
				return "unknown";
		}
	}

	/**
	 * Send a message to a conversation
	 */ public sendMessage(
		conversationId: string,
		content: string,
		type: "text" | "image" | "audio" = "text"
	): void {
		this.send({
			type: "message.send",
			data: {
				conversationId,
				content,
				type,
				timestamp: new Date().toISOString(),
			},
		});
	}

	/**
	 * Mark message as read
	 */ public markMessageAsRead(messageId: string): void {
		this.send({
			type: "message.read",
			data: { messageId },
		});
	}

	/**
	 * Update user status
	 */ public updateUserStatus(
		status: "online" | "away" | "busy" | "offline"
	): void {
		this.send({
			type: "user.status",
			data: { status },
		});
	}
	/**
	 * Join a conversation
	 */
	public joinConversation(conversationId: string): void {
		this.subscribe(`conversation:${conversationId}`);
	}

	/**
	 * Leave a conversation
	 */
	public leaveConversation(conversationId: string): void {
		this.unsubscribe(`conversation:${conversationId}`);
	}

	/**
	 * Subscribe to booking updates
	 */
	public subscribeToBookingUpdates(userId: string): void {
		this.subscribe(`bookings:${userId}`);
	}

	/**
	 * Subscribe to notifications
	 */
	public subscribeToNotifications(userId: string): void {
		this.subscribe(`notifications:${userId}`);
	}

	private setupEventHandlers(): void {
		if (!this.ws) return;
		this.ws.onmessage = (event) => {
			try {
				const parsed = JSON.parse(event.data as string) as WebSocketMessage;
				this.handleMessage(parsed);
			} catch (error) {
				console.error("Failed to parse WebSocket message:", error);
			}
		};

		this.ws.onclose = (event) => {
			this.stopHeartbeat();
			this.emit("disconnected", event);

			// Don't attempt reconnection if it was a connection refused error (1006)
			// This typically means the WebSocket endpoint doesn't exist
			if (
				!this.isManualClose &&
				event.code !== 1006 &&
				this.reconnectAttempts < this.config.maxReconnectAttempts
			) {
				this.scheduleReconnect();
			} else if (event.code === 1006) {
				console.log(
					"📵 WebSocket endpoint not available, staying in REST mode"
				);
			}
		};

		this.ws.onerror = (error) => {
			this.emit("error", error);
		};
	}

	private handleMessage(message: WebSocketMessage): void {
		this.emit("message", message);

		switch (message.type) {
			case "message.received":
				this.emit("messageReceived", message.data as Message);
				break;

			case "conversation.updated":
				this.emit("conversationUpdated", message.data as ConversationUpdate);
				break;

			case "booking.updated":
				this.emit("bookingUpdated", message.data as BookingUpdate);
				break;

			case "notification.received":
				this.emit("notificationReceived", message.data as NotificationData);
				break;

			case "user.status":
				this.emit("userStatusChanged", message.data as UserStatus);
				break;

			case "pong":
				this.emit("heartbeat", message.data);
				break;

			default:
				console.warn("Unknown WebSocket message type:", message.type);
		}
	}
	private startHeartbeat(): void {
		if (!this.config.enableHeartbeat) return;

		this.stopHeartbeat();
		this.heartbeatTimer = setInterval(() => {
			if (this.isConnected()) {
				this.send({
					type: "ping",
					data: { timestamp: Date.now() },
				});
			}
		}, this.config.heartbeatInterval);
	}

	private stopHeartbeat(): void {
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}
	}

	private scheduleReconnect(): void {
		// Don't reconnect if we know the server is unavailable
		if (this.serverUnavailable) {
			console.log("📵 Server unavailable, not attempting reconnection");
			return;
		}

		this.clearReconnectTimer();
		this.reconnectAttempts++;

		const delay = Math.min(
			this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
			30000 // Max 30 seconds
		);

		this.emit("reconnecting", { attempt: this.reconnectAttempts, delay });

		this.reconnectTimer = setTimeout(() => {
			const reconnect = async () => {
				try {
					await this.connect();
					this.emit("reconnected");
				} catch (error) {
					// If still failing, don't log errors for expected unavailability
					if (
						this.reconnectAttempts < this.config.maxReconnectAttempts &&
						!this.serverUnavailable
					) {
						this.scheduleReconnect();
					}
				}
			};
			void reconnect();
		}, delay);
	}

	private clearReconnectTimer(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}
	private resubscribe(): void {
		for (const channel of this.subscriptions) {
			this.send({
				type: "subscribe",
				data: { channel },
			});
		}
	}
	private generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}
}

// Export singleton instance
let webSocketService: VibrattoWebSocketService | null = null;

export function getWebSocketService(
	config?: Partial<WebSocketConfig>
): VibrattoWebSocketService {
	webSocketService ??= new VibrattoWebSocketService(config);
	return webSocketService;
}

/**
 * WebSocket event types for type safety
 */
export const WEBSOCKET_EVENTS = {
	// Connection events
	CONNECTED: "connected",
	DISCONNECTED: "disconnected",
	ERROR: "error",
	RECONNECTING: "reconnecting",
	RECONNECTED: "reconnected",

	// Message events
	MESSAGE_RECEIVED: "messageReceived",
	CONVERSATION_UPDATED: "conversationUpdated",

	// Booking events
	BOOKING_UPDATED: "bookingUpdated",

	// Notification events
	NOTIFICATION_RECEIVED: "notificationReceived",

	// User events
	USER_STATUS_CHANGED: "userStatusChanged",

	// System events
	HEARTBEAT: "heartbeat",
} as const;

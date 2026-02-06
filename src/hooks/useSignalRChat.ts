import { useEffect, useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
	chatSignalRService,
	type SignalRMessage,
} from "../services/signalr/chatService";
import { chatWebSocketService } from "../services/websocket/chatWebSocketService";
import { useAuthStore } from "../store/authStore";
import { messagingKeys } from "./useMessaging";

export interface UseSignalRChatOptions {
	idContratante?: number;
	idContratado?: number;
	autoConnect?: boolean;
	onMessageReceived?: (message: SignalRMessage) => void;
	onMessageRead?: (messageId: number) => void;
	onNotification?: (message: string) => void;
}

export interface UseSignalRChatReturn {
	messages: Array<SignalRMessage>;
	isConnected: boolean;
	isLoading: boolean;
	error: string | null;
	currentConversaId: number | null;
	sendMessage: (content: string) => Promise<void>;
	markAsRead: (messageId: number) => Promise<void>;
	loadHistory: () => Promise<void>;
	initializeChat: (
		idContratante: number,
		idContratado: number
	) => Promise<void>;
	enterConversation: (conversaId: number) => Promise<void>;
}

export const useSignalRChat = (
	options: UseSignalRChatOptions = {}
): UseSignalRChatReturn => {
	const {
		idContratante,
		idContratado,
		autoConnect = true,
		onMessageReceived,
		onMessageRead,
		onNotification,
	} = options;

	const [messages, setMessages] = useState<Array<SignalRMessage>>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentConversaId, setCurrentConversaId] = useState<number | null>(
		null
	);

	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const handlerIdRef = useRef<string>(`handler-${Date.now()}`);
	const messagesRef = useRef<Array<SignalRMessage>>([]);

	// Initialize chat connection
	const initializeChat = useCallback(
		async (contratanteId: number, contratadoId: number) => {
			setIsLoading(true);
			setError(null);

			try {
				// 1. Create or get conversation
				const conversaId = await chatWebSocketService.iniciarConversa(
					contratanteId,
					contratadoId
				);
				setCurrentConversaId(conversaId);

				// 2. Initialize WebSocket connection if not already connected
				if (!chatWebSocketService.isConnected() && user) {
					const token = useAuthStore.getState().token;
					if (token) {
						await chatWebSocketService.initialize(String(user.id), token);
					}
				}

				// 3. Join the conversation for real-time updates
				if (chatWebSocketService.isConnected()) {
					await chatWebSocketService.joinConversation(conversaId);
					setIsConnected(true);
				} else {
					setIsConnected(false);
				}

				// 4. Load history
				const history = await chatWebSocketService.loadMessageHistory(conversaId);
				setMessages(history);
				messagesRef.current = history;
			} catch (error_) {
				const errorMessage =
					error_ instanceof Error ? error_.message : "Erro ao inicializar chat";
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[user]
	);

	// Enter a specific conversation
	const enterConversation = useCallback(async (conversaId: number) => {
		console.log('🚀 enterConversation called with conversaId:', conversaId);
		setIsLoading(true);
		setError(null);

		try {
			// Leave previous conversation if any
			if (currentConversaId && currentConversaId !== conversaId) {
				chatWebSocketService.leaveConversation(currentConversaId);
			}

			// Set conversation ID
			console.log('📝 Setting currentConversaId to:', conversaId);
			setCurrentConversaId(conversaId);

			// Initialize WebSocket if needed
			if (!chatWebSocketService.isConnected() && user) {
				const token = useAuthStore.getState().token;
				if (token) {
					await chatWebSocketService.initialize(String(user.id), token);
				}
			}

			// Join the conversation for real-time updates
			if (chatWebSocketService.isConnected()) {
				await chatWebSocketService.joinConversation(conversaId);
				setIsConnected(true);
				console.log('✅ Joined conversation via WebSocket');
			} else {
				setIsConnected(false);
				console.log('⚠️ WebSocket not connected, using REST-only mode');
			}

			// Load history
			console.log('📥 Loading history for conversation:', conversaId);
			const history = await chatWebSocketService.loadMessageHistory(conversaId);
			console.log('📨 Loaded history:', history.length, 'messages');
			setMessages(history);
			messagesRef.current = history;

			console.log('✅ Successfully entered conversation:', conversaId);

		} catch (error_) {
			const errorMessage =
				error_ instanceof Error ? error_.message : "Erro ao carregar mensagens";
			console.error('❌ Error entering conversation:', error_);
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentConversaId, user]);

	// Send message
	const sendMessage = useCallback(
		async (content: string) => {
			if (!currentConversaId) {
				throw new Error("Nenhuma conversa ativa");
			}

			console.log('📤 Sending message:', { conversaId: currentConversaId, content });
			try {
				// Send via WebSocket (will fallback to REST if not connected)
				await chatWebSocketService.sendMessage(currentConversaId, content);
				console.log('✅ Message sent successfully');

				// If WebSocket is not connected, reload messages manually
				if (!chatWebSocketService.isConnected()) {
					console.log('🔄 WebSocket not connected, reloading messages...');
					const updatedMessages = await chatWebSocketService.loadMessageHistory(currentConversaId);
					setMessages(updatedMessages);
					messagesRef.current = updatedMessages;
				}
				// With WebSocket, the message will be received via the onMessageReceived event

				// Invalidate React Query cache for messages
				queryClient.invalidateQueries({
					queryKey: messagingKeys.conversationMessages(currentConversaId),
				});
			} catch (error_) {
				const errorMessage =
					error_ instanceof Error ? error_.message : "Erro ao enviar mensagem";
				console.error('❌ Error sending message:', error_);
				setError(errorMessage);
				throw error_;
			}
		},
		[currentConversaId, queryClient]
	);

	// Mark message as read
	const markAsRead = useCallback(async (messageId: number) => {
		try {
			// Mark via WebSocket (will fallback to REST if not connected)
			chatWebSocketService.markMessageAsRead(messageId);

			// Update local state immediately
			setMessages((previous) =>
				previous.map((message) => (message.id === messageId ? { ...message, lida: true } : message))
			);
			messagesRef.current = messagesRef.current.map((message) =>
				message.id === messageId ? { ...message, lida: true } : message
			);
		} catch (error_) {
			// Silently handle read errors to not interrupt UX
		}
	}, []);

	// Setup WebSocket event handlers or polling fallback for real-time updates
	useEffect(() => {
		if (!currentConversaId) {
			console.log('🚫 No currentConversaId, skipping WebSocket setup');
			return;
		}

		console.log('🔌 Setting up message handlers for conversation:', currentConversaId);

		// Handle incoming messages
		const handleNewMessage = (message: SignalRMessage) => {
			console.log('📨 New message received via WebSocket:', message);
			
			// Only add message if it's for the current conversation
			if (message.idConversa === currentConversaId) {
				setMessages((previous) => {
					// Check if message already exists
					const exists = previous.some((m) => m.id === message.id);
					if (exists) {
						// Update existing message (e.g., read status)
						return previous.map((m) => m.id === message.id ? message : m);
					}
					// Add new message
					const updated = [...previous, message];
					messagesRef.current = updated;
					return updated;
				});

				// Call custom handler if provided
				onMessageReceived?.(message);

				// Auto mark as read if it's not from current user
				if (user && message.idRemetente !== user.id) {
					markAsRead(message.id);
				}

				// Invalidate conversations query to update last message in sidebar
				queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
			}
		};

		// Handle message read status updates
		const handleMessageRead = (messageId: number) => {
			console.log('✅ Message marked as read:', messageId);
			setMessages((previous) =>
				previous.map((message) => 
					message.id === messageId ? { ...message, lida: true } : message
				)
			);
			messagesRef.current = messagesRef.current.map((message) =>
				message.id === messageId ? { ...message, lida: true } : message
			);
			onMessageRead?.(messageId);
		};

		// Handle connection status changes
		const handleConnectionStatus = (connected: boolean) => {
			console.log(connected ? '✅ WebSocket connected' : '❌ WebSocket disconnected');
			setIsConnected(connected);
			
			// If reconnected, reload messages to ensure sync
			if (connected && currentConversaId) {
				chatWebSocketService.loadMessageHistory(currentConversaId).then((history) => {
					setMessages(history);
					messagesRef.current = history;
				}).catch(console.error);
			}
		};

		// Handle errors
		const handleError = (error: Error) => {
			// Don't show error for expected WebSocket unavailability
			if (error.message?.includes('WebSocket not available')) {
				console.log('📵 WebSocket not available, continuing with REST API');
				return;
			}
			console.error('❌ WebSocket error:', error);
			setError(error.message);
		};

		// Register event handlers
		chatWebSocketService.on('onMessageReceived', handleNewMessage);
		chatWebSocketService.on('onMessageRead', handleMessageRead);
		chatWebSocketService.on('connectionStatusChanged', handleConnectionStatus);
		chatWebSocketService.on('error', handleError);

		// Set up polling fallback if WebSocket is not connected
		let pollInterval: NodeJS.Timeout | null = null;
		if (!chatWebSocketService.isConnected() && currentConversaId) {
			console.log('⚠️ WebSocket not connected, using polling fallback every 5 seconds');
			
			const pollForMessages = async () => {
				try {
					const latestMessages = await chatWebSocketService.loadMessageHistory(currentConversaId);
					
					// Check for new messages
					if (latestMessages.length !== messagesRef.current.length) {
						setMessages(latestMessages);
						messagesRef.current = latestMessages;
						
						// Check if there's a new message
						const lastMessage = latestMessages[latestMessages.length - 1];
						if (lastMessage && (!messagesRef.current.length || 
							lastMessage.id !== messagesRef.current[messagesRef.current.length - 1]?.id)) {
							// Trigger new message handler
							onMessageReceived?.(lastMessage);
						}
						
						// Invalidate conversations query to update last message in sidebar
						queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
					}
				} catch (error) {
					console.error('❌ Polling error:', error);
				}
			};

			// Poll every 5 seconds when WebSocket is not available
			pollInterval = setInterval(pollForMessages, 5000);
			
			// Initial poll
			pollForMessages();
		}

		// Cleanup
		return () => {
			console.log('🧹 Cleaning up message handlers for conversation:', currentConversaId);
			chatWebSocketService.off('onMessageReceived', handleNewMessage);
			chatWebSocketService.off('onMessageRead', handleMessageRead);
			chatWebSocketService.off('connectionStatusChanged', handleConnectionStatus);
			chatWebSocketService.off('error', handleError);
			
			if (pollInterval) {
				clearInterval(pollInterval);
			}
		};
	}, [currentConversaId, user, queryClient, onMessageReceived, onMessageRead, markAsRead]);

	// Load history
	const loadHistory = useCallback(async () => {
		if (!currentConversaId) return;

		setIsLoading(true);
		try {
			const history =
				await chatWebSocketService.loadMessageHistory(currentConversaId);
			setMessages(history);
			messagesRef.current = history;
		} catch (error_) {
			const errorMessage =
				error_ instanceof Error ? error_.message : "Erro ao carregar histórico";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, [currentConversaId]);

	// Setup SignalR event handlers
	useEffect(() => {
		const handlerId = handlerIdRef.current;

		// Message received handler
		const handleMessage = (message: SignalRMessage) => {
			// Add to local state
			setMessages((previous) => {
				const exists = previous.some((m) => m.id === message.id);
				if (exists) return previous;
				return [...previous, message];
			});
			messagesRef.current = [...messagesRef.current, message];

			// Call custom handler
			onMessageReceived?.(message);

			// Auto mark as read if it's not from current user
			if (user && message.idRemetente !== user.id) {
				markAsRead(message.id);
			}

			// Invalidate React Query cache
			if (currentConversaId) {
				queryClient.invalidateQueries({
					queryKey: messagingKeys.conversationMessages(currentConversaId),
				});
			}
		};

		// Message read handler
		const handleMessageRead = (messageId: number) => {
			// Update local state
			setMessages((previous) =>
				previous.map((message) => (message.id === messageId ? { ...message, lida: true } : message))
			);
			messagesRef.current = messagesRef.current.map((message) =>
				message.id === messageId ? { ...message, lida: true } : message
			);

			// Call custom handler
			onMessageRead?.(messageId);
		};

		// Notification handler
		const handleNotification = (message: string) => {
			onNotification?.(message);
		};

		// Register handlers
		chatSignalRService.onMessage(handlerId, handleMessage);
		chatSignalRService.onMessageRead(handlerId, handleMessageRead);
		chatSignalRService.onNotification(handlerId, handleNotification);

		// Cleanup
		return () => {
			chatSignalRService.offMessage(handlerId);
			chatSignalRService.offMessageRead(handlerId);
			chatSignalRService.offNotification(handlerId);
		};
	}, [
		user,
		currentConversaId,
		queryClient,
		onMessageReceived,
		onMessageRead,
		onNotification,
		markAsRead,
	]);

	// Auto-connect on mount if IDs provided
	useEffect(() => {
		if (autoConnect && idContratante && idContratado && !isConnected) {
			initializeChat(idContratante, idContratado);
		}
	}, [autoConnect, idContratante, idContratado, isConnected, initializeChat]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			// Leave conversation when component unmounts
			if (currentConversaId) {
				chatWebSocketService.leaveConversation(currentConversaId);
			}
			// Don't disconnect WebSocket here as other components might be using it
		};
	}, [currentConversaId]);

	// Check WebSocket connection status periodically
	useEffect(() => {
		const checkConnection = setInterval(() => {
			const connected = chatWebSocketService.isConnected();
			setIsConnected(connected);
		}, 5000);

		return () => { clearInterval(checkConnection); };
	}, []);

	return {
		messages,
		isConnected,
		isLoading,
		error,
		currentConversaId,
		sendMessage,
		markAsRead,
		loadHistory,
		initializeChat,
		enterConversation,
	};
};

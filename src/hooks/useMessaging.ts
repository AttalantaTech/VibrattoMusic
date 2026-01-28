// Messaging hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagingService } from "../api";
import type {
	Message,
	Conversation,
	Notification,
	SendMessageRequest,
	PaginationParameters,
	PaginatedResponse,
} from "../api/types";

// Query Keys
export const messagingKeys = {
	all: ["messaging"] as const,
	conversations: () => [...messagingKeys.all, "conversations"] as const,
	conversation: (id: number) => [...messagingKeys.conversations(), id] as const,
	conversationMessages: (id: number) =>
		[...messagingKeys.conversation(id), "messages"] as const,
	messages: () => [...messagingKeys.all, "messages"] as const,
	notifications: () => [...messagingKeys.all, "notifications"] as const,
	notificationCount: () => [...messagingKeys.notifications(), "count"] as const,
};

/**
 * Hook to get conversations
 */
export const useConversations = (
	IdProdutoMusical: number | null | undefined,
	parameters?: PaginationParameters,
	enabled: boolean = true
) => {
	return useQuery<PaginatedResponse<Conversation>, Error>({
		queryKey: [...messagingKeys.conversations(), IdProdutoMusical, parameters],
		queryFn: () =>
			messagingService.getConversations(IdProdutoMusical, parameters),
		enabled,
		staleTime: 30 * 1000, // 30 seconds
		refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time feel
	});
};

/**
 * Hook to get conversation by ID
 */
export const useConversation = (
	conversationId: number,
	enabled: boolean = true
) => {
	return useQuery<Conversation, Error>({
		queryKey: messagingKeys.conversation(conversationId),
		queryFn: () => messagingService.getConversation(conversationId),
		enabled: enabled && conversationId > 0,
		staleTime: 10 * 1000, // 10 seconds
	});
};

/**
 * Hook to get conversation messages
 */
export const useConversationMessages = (
	conversationId: number,
	parameters?: PaginationParameters,
	enabled: boolean = true
) => {
	return useQuery<PaginatedResponse<Message>, Error>({
		queryKey: messagingKeys.conversationMessages(conversationId),
		queryFn: () =>
			messagingService.getConversationMessages(conversationId, parameters),
		enabled: enabled && conversationId > 0,
		staleTime: 5 * 1000, // 5 seconds
		refetchInterval: 3 * 1000, // Refetch every 3 seconds for real-time messages
	});
};

/**
 * Hook to get messages
 */
export const useMessages = (
	parameters?: PaginationParameters & { conversaId?: number },
	enabled: boolean = true
) => {
	return useQuery<PaginatedResponse<Message>, Error>({
		queryKey: messagingKeys.messages(),
		queryFn: () => messagingService.getMessages(parameters),
		enabled,
		staleTime: 30 * 1000, // 30 seconds
	});
};

/**
 * Hook to send a message
 */
export const useSendMessage = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (messageData: SendMessageRequest) =>
			messagingService.sendMessage(messageData),
		onSuccess: (data) => {
			// Parse conversationId safely
			const conversationId =
				typeof data.idConversa === "string"
					? parseInt(data.idConversa, 10)
					: Number(data.idConversa);

			// Only invalidate if we have a valid conversation ID
			if (!isNaN(conversationId) && conversationId > 0) {
				// Invalidate conversation messages
				void queryClient.invalidateQueries({
					queryKey: messagingKeys.conversationMessages(conversationId),
				});
			}

			// Invalidate conversations list
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.conversations(),
			});
		},
	});
};

/**
 * Hook to start a new conversation
 */
export const useStartConversation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			participanteId,
			assunto,
			conteudo,
		}: {
			participanteId: number;
			assunto: string;
			conteudo: string;
		}) => messagingService.startConversation(participanteId, assunto, conteudo),
		onSuccess: () => {
			// Invalidate conversations list
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.conversations(),
			});
		},
	});
};

/**
 * Hook to mark conversation as read
 */
export const useMarkConversationAsRead = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (conversationId: number) =>
			messagingService.markConversationAsRead(conversationId),
		onSuccess: (_, conversationId) => {
			// Invalidate conversation
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.conversation(conversationId),
			});
			// Invalidate unread count
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.notificationCount(),
			});
		},
	});
};

/**
 * Hook to mark message as read
 */
export const useMarkMessageAsRead = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (messageId: number) => messagingService.markAsRead(messageId),
		onSuccess: () => {
			// Invalidate messages and unread count
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.messages(),
			});
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.notificationCount(),
			});
		},
	});
};

/**
 * Hook to reply to message
 */
export const useReplyToMessage = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			messageId,
			conteudo,
		}: {
			messageId: number;
			conteudo: string;
		}) => messagingService.replyToMessage(messageId, conteudo),
		onSuccess: () => {
			// Invalidate messages
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.messages(),
			});
		},
	});
};

/**
 * Hook to get notifications
 */
export const useNotifications = (
	parameters?: PaginationParameters & { tipo?: string; lida?: boolean },
	enabled: boolean = true
) => {
	return useQuery<PaginatedResponse<Notification>, Error>({
		queryKey: messagingKeys.notifications(),
		queryFn: () => messagingService.getNotifications(parameters),
		enabled,
		staleTime: 30 * 1000, // 30 seconds
		refetchInterval: 15 * 1000, // Refetch every 15 seconds
	});
};

/**
 * Hook to get unread notification count
 */
export const useUnreadNotificationCount = (enabled: boolean = true) => {
	return useQuery({
		queryKey: messagingKeys.notificationCount(),
		queryFn: () => messagingService.getUnreadCount(),
		enabled,
		staleTime: 10 * 1000, // 10 seconds
		refetchInterval: 5 * 1000, // Refetch every 5 seconds
	});
};

/**
 * Hook to mark notification as read
 */
export const useMarkNotificationAsRead = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (notificationId: number) =>
			messagingService.markNotificationAsRead(notificationId),
		onSuccess: () => {
			// Invalidate notifications and count
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.notifications(),
			});
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.notificationCount(),
			});
		},
	});
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllNotificationsAsRead = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => messagingService.markAllNotificationsAsRead(),
		onSuccess: () => {
			// Invalidate notifications and count
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.notifications(),
			});
			void queryClient.invalidateQueries({
				queryKey: messagingKeys.notificationCount(),
			});
		},
	});
};

/**
 * Hook to send typing indicator
 */
export const useSendTypingIndicator = () => {
	return useMutation({
		mutationFn: ({
			conversationId,
			isTyping,
		}: {
			conversationId: number;
			isTyping: boolean;
		}) => messagingService.sendTypingIndicator(conversationId, isTyping),
	});
};

/**
 * Hook to get user online status
 */
export const useUserOnlineStatus = (
	userId: number,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: [...messagingKeys.all, "userStatus", userId],
		queryFn: () => messagingService.getUserOnlineStatus(userId),
		enabled: enabled && userId > 0,
		staleTime: 30 * 1000, // 30 seconds
		refetchInterval: 10 * 1000, // Refetch every 10 seconds
	});
};

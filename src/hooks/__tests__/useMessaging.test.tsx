import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
	useConversations,
	useConversation,
	useConversationMessages,
	useSendMessage,
	useStartConversation,
	useMarkConversationAsRead,
	useMarkMessageAsRead,
	useReplyToMessage,
	useNotifications,
	useUnreadNotificationCount,
	useMarkNotificationAsRead,
	useMarkAllNotificationsAsRead,
	useSendTypingIndicator,
	useUserOnlineStatus,
	messagingKeys,
} from "../useMessaging";
import { messagingService } from "../../api";
import type { PaginatedResponse, Conversation, Message, Notification } from "../../api/types";

vi.mock("../../api", () => ({
	messagingService: {
		getConversations: vi.fn(),
		getConversation: vi.fn(),
		getConversationMessages: vi.fn(),
		getMessages: vi.fn(),
		sendMessage: vi.fn(),
		startConversation: vi.fn(),
		markConversationAsRead: vi.fn(),
		markAsRead: vi.fn(),
		replyToMessage: vi.fn(),
		getNotifications: vi.fn(),
		getUnreadCount: vi.fn(),
		markNotificationAsRead: vi.fn(),
		markAllNotificationsAsRead: vi.fn(),
		sendTypingIndicator: vi.fn(),
		getUserOnlineStatus: vi.fn(),
	},
}));

describe("useMessaging hooks", () => {
	let queryClient: QueryClient;

	const createWrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});
		vi.clearAllMocks();
	});

	describe("useConversations", () => {
		it("should fetch conversations", async () => {
			const mockConversations: PaginatedResponse<Conversation> = {
				data: [
					{
						id: "conv-1",
						participants: ["user-1", "user-2"],
						unreadCount: 2,
						createdAt: "2024-01-01T10:00:00Z",
						updatedAt: "2024-01-01T10:00:00Z",
					},
				],
				pagination: {
					currentPage: 1,
					totalPages: 1,
					totalItems: 1,
					itemsPerPage: 20,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};

			vi.mocked(messagingService.getConversations).mockResolvedValue(
				mockConversations
			);

			const { result } = renderHook(() => useConversations({}), {
				wrapper: createWrapper,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockConversations);
			// Without a musical product only the pagination goes to the API
			expect(messagingService.getConversations).toHaveBeenCalledWith({
				parameters: undefined,
			});
		});

		it("should fetch conversations with pagination parameters", async () => {
			const parameters = { page: 2, limit: 10 };
			const mockConversations: PaginatedResponse<Conversation> = {
				data: [],
				pagination: {
					currentPage: 2,
					totalPages: 5,
					totalItems: 50,
					itemsPerPage: 10,
					hasNextPage: true,
					hasPreviousPage: true,
				},
			};

			vi.mocked(messagingService.getConversations).mockResolvedValue(
				mockConversations
			);

			const { result } = renderHook(
				() =>
					useConversations({
						parameters,
						IdProdutoMusical: 3,
						IdContratante: 7,
					}),
				{ wrapper: createWrapper }
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(messagingService.getConversations).toHaveBeenCalledWith({
				IdContratante: 7,
				IdProdutoMusical: 3,
				IdProdutoMusicalContratante: undefined,
				parameters,
			});
		});

		it("should not fetch when disabled", () => {
			const { result } = renderHook(() => useConversations({ enabled: false }), {
				wrapper: createWrapper,
			});

			expect(result.current.status).toBe('pending');
			expect(messagingService.getConversations).not.toHaveBeenCalled();
		});
	});

	describe("useConversation", () => {
		it("should fetch a single conversation", async () => {
			const conversationId = 123;
			const mockConversation: Conversation = {
				id: "conv-123",
				participants: ["user-1", "user-2"],
				unreadCount: 0,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};

			vi.mocked(messagingService.getConversation).mockResolvedValue(
				mockConversation
			);

			const { result } = renderHook(() => useConversation(conversationId), {
				wrapper: createWrapper,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockConversation);
			expect(messagingService.getConversation).toHaveBeenCalledWith(
				conversationId
			);
		});

		it("should not fetch when conversationId is 0", () => {
			const { result } = renderHook(() => useConversation(0), {
				wrapper: createWrapper,
			});

			expect(result.current.status).toBe('pending');
			expect(messagingService.getConversation).not.toHaveBeenCalled();
		});
	});

	describe("useConversationMessages", () => {
		it("should fetch conversation messages", async () => {
			const conversationId = 456;
			const mockMessages: PaginatedResponse<Message> = {
				data: [
					{
						id: "msg-1",
						conversationId: "conv-456",
						senderId: "user-1",
						receiverId: "user-2",
						content: "Hello",
						type: "text",
						status: "delivered",
						createdAt: "2024-01-01T10:00:00Z",
						updatedAt: "2024-01-01T10:00:00Z",
					},
				],
				pagination: {
					currentPage: 1,
					totalPages: 1,
					totalItems: 1,
					itemsPerPage: 50,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};

			vi.mocked(messagingService.getConversationMessages).mockResolvedValue(
				mockMessages
			);

			const { result } = renderHook(
				() => useConversationMessages(conversationId),
				{
					wrapper: createWrapper,
				}
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// Infinite query: the API response is the first page
			expect(result.current.data?.pages[0]).toEqual(mockMessages);
			expect(messagingService.getConversationMessages).toHaveBeenCalledWith(
				conversationId,
				undefined
			);
		});
	});

	describe("useSendMessage", () => {
		it("should send a message and invalidate queries", async () => {
			const messageData = {
				conversationId: "conv-1",
				receiverId: "user-2",
				content: "Test message",
			};

			// The API answers with idConversa, used to refresh that conversation
			const mockResponse = {
				idConversa: 1,
				id: "msg-new",
				conversationId: "conv-1",
				senderId: "user-1",
				receiverId: "user-2",
				content: "Test message",
				type: "text",
				status: "sent",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};

			vi.mocked(messagingService.sendMessage).mockResolvedValue(
				mockResponse as never
			);

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useSendMessage(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync(messageData);

			expect(messagingService.sendMessage).toHaveBeenCalledWith(messageData);
			
			await waitFor(() => {
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.conversationMessages(1),
				});
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.conversations(),
				});
			});
		});
	});

	describe("useStartConversation", () => {
		it("should start a conversation and invalidate queries", async () => {
			const conversationData = {
				participanteId: 789,
				assunto: "Test Subject",
				conteudo: "Test content",
			};

			const mockResponse: Conversation = {
				id: "conv-new",
				participants: ["user-1", "user-789"],
				unreadCount: 0,
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};

			vi.mocked(messagingService.startConversation).mockResolvedValue(
				mockResponse
			);

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useStartConversation(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync(conversationData);

			expect(messagingService.startConversation).toHaveBeenCalledWith(
				conversationData
			);

			await waitFor(() => {
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.conversations(),
				});
			});
		});
	});

	describe("useMarkConversationAsRead", () => {
		it("should mark conversation as read and invalidate queries", async () => {
			const conversationId = 123;

			vi.mocked(messagingService.markConversationAsRead).mockResolvedValue(
				undefined
			);

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useMarkConversationAsRead(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync(conversationId);

			expect(messagingService.markConversationAsRead).toHaveBeenCalledWith(
				conversationId
			);

			await waitFor(() => {
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.conversation(conversationId),
				});
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.notificationCount(),
				});
			});
		});
	});

	describe("useMarkMessageAsRead", () => {
		it("should mark message as read and invalidate queries", async () => {
			const messageId = 456;

			vi.mocked(messagingService.markAsRead).mockResolvedValue(undefined);

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useMarkMessageAsRead(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync(messageId);

			expect(messagingService.markAsRead).toHaveBeenCalledWith(messageId);

			await waitFor(() => {
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.messages(),
				});
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.notificationCount(),
				});
			});
		});
	});

	describe("useReplyToMessage", () => {
		it("should reply to message and invalidate queries", async () => {
			const replyData = {
				messageId: 789,
				conteudo: "This is my reply",
			};

			const mockResponse: Message = {
				id: "msg-reply",
				conversationId: "conv-1",
				senderId: "user-1",
				receiverId: "user-2",
				content: "This is my reply",
				type: "text",
				status: "sent",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};

			vi.mocked(messagingService.replyToMessage).mockResolvedValue(mockResponse);

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useReplyToMessage(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync(replyData);

			expect(messagingService.replyToMessage).toHaveBeenCalledWith(
				replyData.messageId,
				replyData.conteudo
			);

			await waitFor(() => {
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.messages(),
				});
			});
		});
	});

	describe("useNotifications", () => {
		it("should fetch notifications", async () => {
			const mockNotifications: PaginatedResponse<Notification> = {
				data: [
					{
						id: "notif-1",
						userId: "user-1",
						type: "message",
						title: "New message",
						message: "You have a new message",
						read: false,
						createdAt: "2024-01-01T10:00:00Z",
						updatedAt: "2024-01-01T10:00:00Z",
					},
				],
				pagination: {
					currentPage: 1,
					totalPages: 1,
					totalItems: 1,
					itemsPerPage: 20,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};

			vi.mocked(messagingService.getNotifications).mockResolvedValue(
				mockNotifications
			);

			const { result } = renderHook(() => useNotifications(), {
				wrapper: createWrapper,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockNotifications);
			expect(messagingService.getNotifications).toHaveBeenCalledWith(undefined);
		});

		it("should fetch notifications with filters", async () => {
			const parameters = { tipo: "booking", lida: false };
			const mockNotifications: PaginatedResponse<Notification> = {
				data: [],
				pagination: {
					currentPage: 1,
					totalPages: 0,
					totalItems: 0,
					itemsPerPage: 20,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};

			vi.mocked(messagingService.getNotifications).mockResolvedValue(
				mockNotifications
			);

			const { result } = renderHook(() => useNotifications(parameters), {
				wrapper: createWrapper,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(messagingService.getNotifications).toHaveBeenCalledWith(parameters);
		});
	});

	describe("useUnreadNotificationCount", () => {
		it("should fetch unread notification count", async () => {
			const mockCount = {
				count: 5,
				byType: {
					message: 3,
					booking: 2,
				},
			};

			vi.mocked(messagingService.getUnreadCount).mockResolvedValue(mockCount);

			const { result } = renderHook(() => useUnreadNotificationCount(), {
				wrapper: createWrapper,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockCount);
			expect(messagingService.getUnreadCount).toHaveBeenCalled();
		});
	});

	describe("useMarkNotificationAsRead", () => {
		it("should mark notification as read and invalidate queries", async () => {
			const notificationId = 111;

			vi.mocked(messagingService.markNotificationAsRead).mockResolvedValue(
				undefined
			);

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useMarkNotificationAsRead(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync(notificationId);

			expect(messagingService.markNotificationAsRead).toHaveBeenCalledWith(
				notificationId
			);

			await waitFor(() => {
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.notifications(),
				});
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.notificationCount(),
				});
			});
		});
	});

	describe("useMarkAllNotificationsAsRead", () => {
		it("should mark all notifications as read and invalidate queries", async () => {
			vi.mocked(messagingService.markAllNotificationsAsRead).mockResolvedValue(
				undefined
			);

			const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

			const { result } = renderHook(() => useMarkAllNotificationsAsRead(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync();

			expect(messagingService.markAllNotificationsAsRead).toHaveBeenCalled();

			await waitFor(() => {
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.notifications(),
				});
				expect(invalidateSpy).toHaveBeenCalledWith({
					queryKey: messagingKeys.notificationCount(),
				});
			});
		});
	});

	describe("useSendTypingIndicator", () => {
		it("should send typing indicator", async () => {
			const typingData = {
				conversationId: 222,
				isTyping: true,
			};

			vi.mocked(messagingService.sendTypingIndicator).mockResolvedValue(
				undefined
			);

			const { result } = renderHook(() => useSendTypingIndicator(), {
				wrapper: createWrapper,
			});

			await result.current.mutateAsync(typingData);

			expect(messagingService.sendTypingIndicator).toHaveBeenCalledWith(
				typingData.conversationId,
				typingData.isTyping
			);
		});
	});

	describe("useUserOnlineStatus", () => {
		it("should fetch user online status", async () => {
			const userId = 333;
			const mockStatus = {
				online: true,
				lastSeen: "2024-01-01T10:00:00Z",
			};

			vi.mocked(messagingService.getUserOnlineStatus).mockResolvedValue(
				mockStatus
			);

			const { result } = renderHook(() => useUserOnlineStatus(userId), {
				wrapper: createWrapper,
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockStatus);
			expect(messagingService.getUserOnlineStatus).toHaveBeenCalledWith(userId);
		});

		it("should not fetch when userId is 0", () => {
			const { result } = renderHook(() => useUserOnlineStatus(0), {
				wrapper: createWrapper,
			});

			expect(result.current.status).toBe('pending');
			expect(messagingService.getUserOnlineStatus).not.toHaveBeenCalled();
		});
	});
});
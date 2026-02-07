import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSignalRChat } from "../useSignalRChat";
import { chatSignalRService } from "../../services/signalr/chatService";
import { chatWebSocketService } from "../../services/websocket/chatWebSocketService";
import type { ReactNode } from "react";

// Mock the chat services
vi.mock("../../services/signalr/chatService", () => ({
	chatSignalRService: {
		connect: vi.fn().mockResolvedValue(undefined),
		disconnect: vi.fn().mockResolvedValue(undefined),
		iniciarConversa: vi.fn().mockResolvedValue(123),
		entrarConversa: vi.fn().mockResolvedValue(undefined),
		enviarMensagem: vi.fn().mockResolvedValue(undefined),
		marcarMensagemComoLida: vi.fn().mockResolvedValue(undefined),
		carregarHistorico: vi.fn().mockResolvedValue([]),
		isConnected: vi.fn().mockReturnValue(false),
		onMessage: vi.fn(),
		offMessage: vi.fn(),
		onMessageRead: vi.fn(),
		offMessageRead: vi.fn(),
		onNotification: vi.fn(),
		offNotification: vi.fn(),
	},
}));

// Mock the WebSocket chat service
vi.mock("../../services/websocket/chatWebSocketService", () => ({
	chatWebSocketService: {
		initialize: vi.fn().mockResolvedValue(undefined),
		disconnect: vi.fn().mockResolvedValue(undefined),
		iniciarConversa: vi.fn().mockResolvedValue(123),
		joinConversation: vi.fn().mockResolvedValue(undefined),
		sendMessage: vi.fn().mockResolvedValue(undefined),
		markMessageAsRead: vi.fn().mockResolvedValue(undefined),
		loadMessageHistory: vi.fn().mockResolvedValue([]),
		isConnected: vi.fn().mockReturnValue(false),
		leaveConversation: vi.fn().mockResolvedValue(undefined),
		on: vi.fn(),
		off: vi.fn(),
		updateUserStatus: vi.fn(),
		sendTypingIndicator: vi.fn(),
		getStatus: vi.fn().mockReturnValue({ connected: false, initialized: true, currentConversation: null, queuedMessages: 0, reconnectAttempts: 0, mode: 'rest' }),
	},
}));

// Mock auth store
vi.mock("../../store/authStore", () => ({
	useAuthStore: vi.fn(() => ({
		user: { id: 1, nome: "Test User", userType: "cliente" },
	})),
}));

describe("useSignalRChat", () => {
	let queryClient: QueryClient;

	const wrapper = ({ children }: { children: ReactNode }) => (
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

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Initialization", () => {
		it("should initialize with default state", () => {
			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			expect(result.current.messages).toEqual([]);
			expect(result.current.isConnected).toBe(false);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
			expect(result.current.currentConversaId).toBeNull();
		});

		it("should auto-connect when IDs are provided", async () => {
			renderHook(
				() =>
					useSignalRChat({
						idContratante: 1,
						idContratado: 2,
						autoConnect: true,
					}),
				{ wrapper }
			);

			await waitFor(() => {
				expect(chatWebSocketService.iniciarConversa).toHaveBeenCalledWith(1, 2);
			});
		});

		it("should not auto-connect when autoConnect is false", async () => {
			renderHook(
				() =>
					useSignalRChat({
						idContratante: 1,
						idContratado: 2,
						autoConnect: false,
					}),
				{ wrapper }
			);

			await waitFor(() => {
				expect(chatWebSocketService.iniciarConversa).not.toHaveBeenCalled();
			});
		});
	});

	describe("initializeChat", () => {
		it("should initialize chat connection", async () => {
			(chatWebSocketService.iniciarConversa as any).mockResolvedValue(123);
			(chatWebSocketService.loadMessageHistory as any).mockResolvedValue([
				{ id: 1, conteudo: "Test message" },
			]);

			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			await act(async () => {
				await result.current.initializeChat(1, 2);
			});

			expect(chatWebSocketService.iniciarConversa).toHaveBeenCalledWith(1, 2);
			expect(chatWebSocketService.initialize).toHaveBeenCalled();
			expect(chatWebSocketService.joinConversation).toHaveBeenCalledWith(123);
			expect(chatWebSocketService.loadMessageHistory).toHaveBeenCalledWith(123);
			expect(result.current.currentConversaId).toBe(123);
			expect(result.current.messages).toHaveLength(1);
		});

		it("should handle initialization errors", async () => {
			const error = new Error("Connection failed");
			(chatWebSocketService.iniciarConversa as any).mockRejectedValue(error);

			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			await act(async () => {
				await result.current.initializeChat(1, 2);
			});

			expect(result.current.error).toBe("Connection failed");
			expect(result.current.isLoading).toBe(false);
		});
	});

	describe("enterConversation", () => {
		it("should enter an existing conversation", async () => {
			(chatWebSocketService.isConnected as any).mockReturnValue(true);
			(chatWebSocketService.loadMessageHistory as any).mockResolvedValue([
				{ id: 1, conteudo: "Message 1" },
				{ id: 2, conteudo: "Message 2" },
			]);

			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			await act(async () => {
				await result.current.enterConversation(456);
			});

			expect(chatWebSocketService.joinConversation).toHaveBeenCalledWith(456);
			expect(chatWebSocketService.loadMessageHistory).toHaveBeenCalledWith(456);
			expect(result.current.currentConversaId).toBe(456);
			expect(result.current.messages).toHaveLength(2);
		});

		it("should connect first if not connected", async () => {
			(chatWebSocketService.isConnected as any).mockReturnValue(false);

			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			await act(async () => {
				await result.current.enterConversation(456);
			});

			expect(chatWebSocketService.initialize).toHaveBeenCalled();
			expect(chatWebSocketService.joinConversation).toHaveBeenCalledWith(456);
		});
	});

	describe("sendMessage", () => {
		it("should send a message", async () => {
			// Setup mocks for this test
			(chatWebSocketService.iniciarConversa as any).mockResolvedValue(123);
			(chatWebSocketService.loadMessageHistory as any).mockResolvedValue([
				{ id: 1, conteudo: "Test message" },
			]);

			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			// Set current conversation
			await act(async () => {
				await result.current.initializeChat(1, 2);
			});

			await act(async () => {
				await result.current.sendMessage("Test message");
			});

			expect(chatWebSocketService.sendMessage).toHaveBeenCalledWith(
				123,
				"Test message"
			);
		});

		it("should throw error when no conversation is active", async () => {
			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			await expect(
				act(async () => {
					await result.current.sendMessage("Test message");
				})
			).rejects.toThrow("Nenhuma conversa ativa");
		});

		it("should handle send errors", async () => {
			// Setup mocks for successful initialization
			(chatWebSocketService.iniciarConversa as any).mockResolvedValue(123);
			(chatWebSocketService.loadMessageHistory as any).mockResolvedValue([]);

			// Mock send message to fail
			(chatWebSocketService.sendMessage as any).mockRejectedValue(
				new Error("Send failed")
			);

			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			await act(async () => {
				await result.current.initializeChat(1, 2);
			});

			await expect(
				act(async () => {
					await result.current.sendMessage("Test message");
				})
			).rejects.toThrow("Send failed");

			await waitFor(() => {
				expect(result.current.error).toBe("Send failed");
			});
		});
	});

	describe("markAsRead", () => {
		it("should mark message as read", async () => {
			// Setup mocks with message including lida property
			(chatWebSocketService.iniciarConversa as any).mockResolvedValue(123);
			(chatWebSocketService.loadMessageHistory as any).mockResolvedValue([
				{ id: 1, conteudo: "Test", lida: false },
			]);

			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			await act(async () => {
				await result.current.initializeChat(1, 2);
			});

			await act(async () => {
				await result.current.markAsRead(1);
			});

			expect(chatWebSocketService.markMessageAsRead).toHaveBeenCalledWith(1);
			expect(result.current.messages[0]?.lida).toBe(true);
		});
	});

	describe("loadHistory", () => {
		it("should load conversation history", async () => {
			const mockHistory = [
				{ id: 1, conteudo: "Message 1" },
				{ id: 2, conteudo: "Message 2" },
			];

			// Setup mocks for initialization
			(chatWebSocketService.iniciarConversa as any).mockResolvedValue(123);
			(chatWebSocketService.loadMessageHistory as any).mockResolvedValue(mockHistory);

			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			await act(async () => {
				await result.current.initializeChat(1, 2);
			});

			await act(async () => {
				await result.current.loadHistory();
			});

			// loadMessageHistory should have been called twice: once during init, once during loadHistory
			expect(chatWebSocketService.loadMessageHistory).toHaveBeenCalledWith(123);
			expect(result.current.messages).toEqual(mockHistory);
		});

		it("should handle history load errors", async () => {
			// Setup mocks for successful initialization, then fail on loadHistory
			(chatWebSocketService.iniciarConversa as any).mockResolvedValue(123);
			(chatWebSocketService.loadMessageHistory as any)
				.mockResolvedValueOnce([]) // First call (during init) succeeds
				.mockRejectedValueOnce(new Error("Failed to load")); // Second call (loadHistory) fails

			const { result } = renderHook(() => useSignalRChat(), { wrapper });

			await act(async () => {
				await result.current.initializeChat(1, 2);
			});

			await act(async () => {
				await result.current.loadHistory();
			});

			expect(result.current.error).toBe("Failed to load");
			expect(result.current.isLoading).toBe(false);
		});
	});

	describe("Event Handlers", () => {
		it("should handle incoming messages", async () => {
			const onMessageReceived = vi.fn();
			const { result } = renderHook(
				() => useSignalRChat({ onMessageReceived }),
				{ wrapper }
			);

			// Get the registered handler
			const handlerCall = (chatSignalRService.onMessage as any).mock.calls[0];
			const handler = handlerCall?.[1];

			// Simulate incoming message
			const newMessage = {
				id: 3,
				idRemetente: 2,
				conteudo: "New message",
			};

			act(() => {
				handler?.(newMessage);
			});

			expect(result.current.messages).toContainEqual(newMessage);
			expect(onMessageReceived).toHaveBeenCalledWith(newMessage);
		});

		it("should auto-mark messages as read from other users", async () => {
			renderHook(() => useSignalRChat(), { wrapper });

			// Get the registered handler
			const handlerCall = (chatSignalRService.onMessage as any).mock.calls[0];
			const handler = handlerCall?.[1];

			// Simulate incoming message from another user
			const newMessage = {
				id: 3,
				idRemetente: 2, // Different from current user (1)
				conteudo: "New message",
			};

			await act(async () => {
				handler?.(newMessage);
			});

			// Wait for auto-mark as read
			await waitFor(() => {
				expect(chatSignalRService.marcarMensagemComoLida).toHaveBeenCalledWith(3);
			});
		});

		it("should handle message read events", () => {
			const onMessageRead = vi.fn();
			renderHook(() => useSignalRChat({ onMessageRead }), { wrapper });

			// Get the registered handler
			const handlerCall = (chatSignalRService.onMessageRead as any).mock.calls[0];
			const handler = handlerCall?.[1];

			// Simulate message read event
			act(() => {
				handler?.(123);
			});

			expect(onMessageRead).toHaveBeenCalledWith(123);
		});

		it("should handle notifications", () => {
			const onNotification = vi.fn();
			renderHook(() => useSignalRChat({ onNotification }), { wrapper });

			// Get the registered handler
			const handlerCall = (chatSignalRService.onNotification as any).mock
				.calls[0];
			const handler = handlerCall?.[1];

			// Simulate notification
			act(() => {
				handler?.("User joined the chat");
			});

			expect(onNotification).toHaveBeenCalledWith("User joined the chat");
		});
	});

	describe("Connection Status", () => {
		it("should update connection status periodically", async () => {
			vi.useFakeTimers();
			
			const { result, rerender } = renderHook(() => useSignalRChat(), {
				wrapper,
			});

			expect(result.current.isConnected).toBe(false);

			// Mock connected state
			(chatSignalRService.isConnected as any).mockReturnValue(true);

			// Fast-forward time to trigger status check
			act(() => {
				vi.advanceTimersByTime(5000);
			});

			rerender();

			await waitFor(() => {
				expect(result.current.isConnected).toBe(true);
			});

			vi.useRealTimers();
		});
	});

	describe("Cleanup", () => {
		it("should cleanup handlers on unmount", () => {
			const { unmount } = renderHook(() => useSignalRChat(), { wrapper });

			const handlerId = (chatSignalRService.onMessage as any).mock.calls[0]?.[0];

			unmount();

			expect(chatSignalRService.offMessage).toHaveBeenCalledWith(handlerId);
			expect(chatSignalRService.offMessageRead).toHaveBeenCalledWith(handlerId);
			expect(chatSignalRService.offNotification).toHaveBeenCalledWith(handlerId);
		});
	});
});
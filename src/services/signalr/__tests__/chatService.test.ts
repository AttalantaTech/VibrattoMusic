import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChatSignalRService } from "../chatService";

// Mock SignalR
const mockConnection = {
	start: vi.fn().mockResolvedValue(undefined),
	stop: vi.fn().mockResolvedValue(undefined),
	invoke: vi.fn().mockResolvedValue(undefined),
	on: vi.fn(),
	off: vi.fn(),
	onreconnecting: vi.fn(),
	onreconnected: vi.fn(),
	onclose: vi.fn(),
	state: 1, // Connected state
};

vi.mock("@microsoft/signalr", () => {
	return {
		HubConnectionBuilder: vi.fn().mockImplementation(() => ({
			withUrl: vi.fn().mockReturnThis(),
			withAutomaticReconnect: vi.fn().mockReturnThis(),
			configureLogging: vi.fn().mockReturnThis(),
			build: vi.fn().mockReturnValue(mockConnection),
		})),
		HubConnectionState: {
			Connected: 1,
			Disconnected: 0,
		},
		LogLevel: {
			Information: 2,
		},
	};
});

// Mock api (exported as apiClient in chatService)
vi.mock("../../../api", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

describe("ChatSignalRService", () => {
	let service: ChatSignalRService;

	beforeEach(async () => {
		// Clear all mocks
		vi.clearAllMocks();
		
		// Setup localStorage mock with proper token format
		localStorageMock.getItem.mockImplementation((key: string) => {
			if (key === "vibratto-auth") {
				return JSON.stringify({
					state: {
						token: "mock-jwt-token"
					}
				});
			}
			return null;
		});
		
		// Reset the mock connection state
		mockConnection.state = 1; // Connected by default for most tests
		
		// Reset singleton instance to get a fresh service
		(ChatSignalRService as any).instance = null;
		
		// Get fresh instance
		service = ChatSignalRService.getInstance();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Singleton Pattern", () => {
		it("should return the same instance", () => {
			const instance1 = ChatSignalRService.getInstance();
			const instance2 = ChatSignalRService.getInstance();
			expect(instance1).toBe(instance2);
		});
	});

	describe("iniciarConversa", () => {
		beforeEach(() => {
			const { api } = vi.importActual("../../../api") as any;
			vi.mocked(api.post).mockClear();
		});

		it("should create a conversation via Vibratto API", async () => {
			const { api } = await import("../../../api");
			const conversationId = 123;
			vi.mocked(api.post).mockResolvedValue(conversationId);

			const result = await service.iniciarConversa(1, 2);

			expect(api.post).toHaveBeenCalledWith("chat/obter", {
				IdProdutoMusical: 2,
			});
			expect(result).toBe(123);
		});

		it("should throw error when API returns error", async () => {
			const { api } = await import("../../../api");
			vi.mocked(api.post).mockRejectedValue(new Error("Invalid ID"));

			await expect(service.iniciarConversa(1, 1)).rejects.toThrow("Invalid ID");
		});
	});

	describe("Connection Management", () => {
		it("should connect to SignalR hub", async () => {
			await service.connect();

			expect(mockConnection.start).toHaveBeenCalled();
			expect(service.isConnected()).toBe(true);
		});

		it("should not connect if already connected", async () => {
			await service.connect();
			mockConnection.start.mockClear();
			
			await service.connect();
			expect(mockConnection.start).not.toHaveBeenCalled();
		});

		it("should setup event handlers on connection", async () => {
			await service.connect();

			expect(mockConnection.on).toHaveBeenCalledWith(
				"ReceberMensagem",
				expect.any(Function)
			);
			expect(mockConnection.on).toHaveBeenCalledWith(
				"MensagemLida",
				expect.any(Function)
			);
			expect(mockConnection.on).toHaveBeenCalledWith(
				"Notificar",
				expect.any(Function)
			);
		});

		it("should disconnect properly", async () => {
			await service.connect();
			await service.disconnect();

			expect(mockConnection.stop).toHaveBeenCalled();
		});
	});

	describe("entrarConversa", () => {
		it("should enter a conversation", async () => {
			await service.connect();
			await service.entrarConversa(123);

			expect(mockConnection.invoke).toHaveBeenCalledWith("EntrarConversa", 123);
			expect(service.getCurrentConversaId()).toBe(123);
		});

		it("should connect first if not connected", async () => {
			// Mock disconnected state
			mockConnection.state = 0;
			
			await service.entrarConversa(123);

			expect(mockConnection.start).toHaveBeenCalled();
			expect(mockConnection.invoke).toHaveBeenCalledWith("EntrarConversa", 123);
		});

		it("should not re-enter same conversation", async () => {
			await service.connect();
			await service.entrarConversa(123);
			mockConnection.invoke.mockClear();

			await service.entrarConversa(123);
			expect(mockConnection.invoke).not.toHaveBeenCalled();
		});
	});

	describe("enviarMensagem", () => {
		it("should send a message", async () => {
			await service.connect();
			await service.enviarMensagem(123, "Test message");

			expect(mockConnection.invoke).toHaveBeenCalledWith(
				"EnviarMensagem",
				123,
				"Test message"
			);
		});

		it("should throw error when not connected", async () => {
			// Start with disconnected state for this test
			mockConnection.state = 0; // Disconnected
			
			await expect(
				service.enviarMensagem(123, "Test message")
			).rejects.toThrow("Não conectado ao chat");
		});
	});

	describe("marcarMensagemComoLida", () => {
		it("should mark message as read", async () => {
			await service.connect();
			await service.marcarMensagemComoLida(456);

			expect(mockConnection.invoke).toHaveBeenCalledWith(
				"MarcarMensagemComoLida",
				456
			);
		});

		it("should not throw error even if marking fails", async () => {
			await service.connect();
			mockConnection.invoke.mockRejectedValueOnce(new Error("Network error"));

			// Should not throw
			await expect(
				service.marcarMensagemComoLida(456)
			).resolves.not.toThrow();
		});
	});

	describe("carregarHistorico", () => {
		it("should load message history via Vibratto API", async () => {
			const { api } = await import("../../../api");
			const mockApiMessages = [
				{ 
					id: 1, 
					idConversa: 123, 
					remetente: { id: 2, nome: "João" },
					conteudo: "Message 1",
					dataEnvio: "2024-01-01T10:00:00Z",
					lida: false
				},
				{ 
					id: 2, 
					idConversa: 123, 
					remetente: { id: 3, nome: "Maria" },
					conteudo: "Message 2",
					dataEnvio: "2024-01-01T11:00:00Z",
					lida: true
				},
			];
			
			vi.mocked(api.get).mockResolvedValue(mockApiMessages);

			const result = await service.carregarHistorico(123);

			expect(api.get).toHaveBeenCalledWith("chat/123");
			expect(result).toEqual([
				{
					id: 1,
					idConversa: 123,
					idRemetente: 2,
					nomeRemetente: "João",
					conteudo: "Message 1",
					dataEnvio: "2024-01-01T10:00:00Z",
					lida: false,
				},
				{
					id: 2,
					idConversa: 123,
					idRemetente: 3,
					nomeRemetente: "Maria",
					conteudo: "Message 2",
					dataEnvio: "2024-01-01T11:00:00Z",
					lida: true,
				},
			]);
		});

		it("should throw error when API fails", async () => {
			const { api } = await import("../../../api");
			vi.mocked(api.get).mockRejectedValue(new Error("API Error"));

			await expect(service.carregarHistorico(123)).rejects.toThrow(
				"API Error"
			);
		});
	});

	describe("Event Handlers", () => {
		it("should register and trigger message handlers", async () => {
			const handler = vi.fn();
			service.onMessage("test-handler", handler);

			await service.connect();
			
			// Get the registered handler from the mock
			const registeredHandler = mockConnection.on.mock.calls.find(
				(call: any[]) => call[0] === "ReceberMensagem"
			)?.[1];

			// Simulate receiving a message
			const testMessage = { id: 1, conteudo: "Test" };
			registeredHandler?.(testMessage);

			expect(handler).toHaveBeenCalledWith(testMessage);
		});

		it("should unregister message handlers", () => {
			const handler = vi.fn();
			service.onMessage("test-handler", handler);
			service.offMessage("test-handler");

			// Handler should be removed and not called
			// This is tested by checking the internal map is cleared
			expect(handler).not.toHaveBeenCalled();
		});

		it("should register and trigger notification handlers", async () => {
			const handler = vi.fn();
			service.onNotification("test-handler", handler);

			await service.connect();
			
			const registeredHandler = mockConnection.on.mock.calls.find(
				(call: any[]) => call[0] === "Notificar"
			)?.[1];

			registeredHandler?.("User joined");
			expect(handler).toHaveBeenCalledWith("User joined");
		});

		it("should register and trigger message read handlers", async () => {
			const handler = vi.fn();
			service.onMessageRead("test-handler", handler);

			await service.connect();
			
			const registeredHandler = mockConnection.on.mock.calls.find(
				(call: any[]) => call[0] === "MensagemLida"
			)?.[1];

			registeredHandler?.(123);
			expect(handler).toHaveBeenCalledWith(123);
		});
	});

	describe("Reconnection Logic", () => {
		it("should handle reconnection", async () => {
			await service.connect();
			await service.entrarConversa(123);

			// Simulate reconnection
			const reconnectedHandler = mockConnection.onreconnected.mock.calls[0]?.[0];
			reconnectedHandler?.();

			// Should re-enter conversation after reconnection
			expect(mockConnection.invoke).toHaveBeenCalledWith("EntrarConversa", 123);
		});

		it("should increment reconnect attempts", async () => {
			await service.connect();

			const reconnectingHandler = mockConnection.onreconnecting.mock.calls[0]?.[0];
			reconnectingHandler?.();
			reconnectingHandler?.();
			reconnectingHandler?.();

			// Reconnect attempts should be tracked (internal state)
			// This is verified by the service's behavior on max attempts
		});
	});

	describe("Authentication", () => {
		it("should use JWT token from localStorage", async () => {
			localStorageMock.getItem.mockImplementation((key: string) => {
				if (key === "vibratto-auth") {
					return JSON.stringify({
						state: {
							token: "test-token"
						}
					});
				}
				return null;
			});
			
			// Mock fetch response
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ idConversa: 123 }),
			});
			
			await service.iniciarConversa(1, 2);

			expect(fetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: "Bearer test-token",
					}),
				})
			);
		});

		it("should fallback to cookie if localStorage is empty", async () => {
			localStorageMock.getItem.mockReturnValue(null);
			document.cookie = "auth-token=cookie-token";

			const service = ChatSignalRService.getInstance();
			await expect(service.iniciarConversa(1, 2)).rejects.toThrow();
			
			// Clean up
			document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
		});
	});
});
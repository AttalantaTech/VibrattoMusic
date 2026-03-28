import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { MessagesTab } from "../MessagesTab";
import type {
	Conversation,
	Message,
	PaginatedResponse,
} from "../../../../api/types";

const mockUseAuthStore = vi.fn();
const mockUseConversations = vi.fn();
const mockUseConversationMessages = vi.fn();
const mockUseSendMessage = vi.fn();
const mockUseMarkConversationAsRead = vi.fn();
const mockUseSendTypingIndicator = vi.fn();

vi.mock("../../../../store/authStore", () => ({
	useAuthStore: () => mockUseAuthStore(),
}));

vi.mock("../../../../hooks/useMessaging", () => ({
	useConversations: () => mockUseConversations(),
	useConversationMessages: (id: number) => mockUseConversationMessages(id),
	useSendMessage: () => mockUseSendMessage(),
	useMarkConversationAsRead: () => mockUseMarkConversationAsRead(),
	useSendTypingIndicator: () => mockUseSendTypingIndicator(),
}));

vi.mock("../SendProposalModal", () => ({
	SendProposalModal: ({ isOpen, onClose }: any) =>
		isOpen ? (
			<div data-testid="send-proposal-modal">
				<button onClick={onClose}>Close Modal</button>
			</div>
		) : null,
}));

describe("MessagesTab", () => {
	let queryClient: QueryClient;

	const createWrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);

	const mockUser = {
		id: "user-1",
		nome: "John Doe",
		email: "john@example.com",
		userType: "produto_musical",
	};

	const mockConversations: PaginatedResponse<Conversation> = {
		data: [
			{
				id: "conv-1",
				participants: ["user-1", "user-2"],
				lastMessage: {
					id: "msg-last",
					conversationId: "conv-1",
					senderId: "user-2",
					receiverId: "user-1",
					content: "Hello there!",
					type: "text",
					status: "delivered",
					createdAt: "2024-01-01T10:00:00Z",
					updatedAt: "2024-01-01T10:00:00Z",
				},
				unreadCount: 2,
				createdAt: "2024-01-01T09:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
				metadata: {
					participantName: "Jane Smith",
					productId: 123,
				},
			},
			{
				id: "conv-2",
				participants: ["user-1", "user-3"],
				lastMessage: {
					id: "msg-last-2",
					conversationId: "conv-2",
					senderId: "user-1",
					receiverId: "user-3",
					content: "Thanks for your message",
					type: "text",
					status: "read",
					createdAt: "2024-01-01T09:30:00Z",
					updatedAt: "2024-01-01T09:30:00Z",
				},
				unreadCount: 0,
				createdAt: "2024-01-01T08:00:00Z",
				updatedAt: "2024-01-01T09:30:00Z",
				metadata: {
					participantName: "Bob Johnson",
					productId: 456,
				},
			},
		],
		pagination: {
			currentPage: 1,
			totalPages: 1,
			totalItems: 2,
			itemsPerPage: 20,
			hasNextPage: false,
			hasPreviousPage: false,
		},
	};

	const mockMessages: PaginatedResponse<Message> = {
		data: [
			{
				id: "msg-1",
				conversationId: "conv-1",
				senderId: "user-2",
				receiverId: "user-1",
				content: "Hi, how are you?",
				type: "text",
				status: "read",
				createdAt: "2024-01-01T09:50:00Z",
				updatedAt: "2024-01-01T09:50:00Z",
			},
			{
				id: "msg-2",
				conversationId: "conv-1",
				senderId: "user-1",
				receiverId: "user-2",
				content: "I'm good, thanks!",
				type: "text",
				status: "delivered",
				createdAt: "2024-01-01T09:55:00Z",
				updatedAt: "2024-01-01T09:55:00Z",
			},
			{
				id: "msg-3",
				conversationId: "conv-1",
				senderId: "user-2",
				receiverId: "user-1",
				content: "Hello there!",
				type: "text",
				status: "delivered",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			},
		],
		pagination: {
			currentPage: 1,
			totalPages: 1,
			totalItems: 3,
			itemsPerPage: 50,
			hasNextPage: false,
			hasPreviousPage: false,
		},
	};

	beforeEach(() => {
		queryClient = new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		});

		mockUseAuthStore.mockReturnValue({ user: mockUser });
		mockUseConversations.mockReturnValue({
			data: mockConversations,
			isLoading: false,
		});
		mockUseConversationMessages.mockReturnValue({
			data: mockMessages,
			isLoading: false,
			refetch: vi.fn(),
		});
		mockUseSendMessage.mockReturnValue({
			mutateAsync: vi.fn(),
			isPending: false,
		});
		mockUseMarkConversationAsRead.mockReturnValue({
			mutate: vi.fn(),
		});
		mockUseSendTypingIndicator.mockReturnValue({
			mutate: vi.fn(),
		});
	});

	describe("Rendering", () => {
		it("should render the chat interface", () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			expect(screen.getByText("John Doe")).toBeInTheDocument();
			expect(screen.getByText("Artista")).toBeInTheDocument();
			expect(screen.getByPlaceholderText("Buscar no chat")).toBeInTheDocument();
		});

		it("should display conversation list", () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
			expect(screen.getByText("Hello there!")).toBeInTheDocument();
			expect(screen.getByText("Thanks for your message")).toBeInTheDocument();
		});

		it("should show unread count badge", () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			expect(screen.getByText("2")).toBeInTheDocument();
		});

		it("should display loading state for conversations", () => {
			mockUseConversations.mockReturnValue({
				data: undefined,
				isLoading: true,
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			expect(screen.getByRole("status")).toBeInTheDocument();
		});

		it("should display empty state when no conversations", () => {
			mockUseConversations.mockReturnValue({
				data: { data: [], pagination: {} },
				isLoading: false,
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			expect(screen.getByText("Nenhuma conversa ainda")).toBeInTheDocument();
		});
	});

	describe("Conversation Selection", () => {
		it("should select first conversation automatically", async () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			await waitFor(() => {
				expect(mockUseMarkConversationAsRead().mutate).toHaveBeenCalledWith(1);
			});
		});

		it("should select conversation on click", async () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			const bobConversation =
				screen.getByText("Bob Johnson").closest("div[role='button']") ||
				screen.getByText("Bob Johnson").closest("div[class*='cursor-pointer']");

			if (bobConversation) {
				fireEvent.click(bobConversation);
			}

			await waitFor(() => {
				expect(mockUseMarkConversationAsRead().mutate).toHaveBeenCalledWith(2);
			});
		});

		it("should display selected conversation messages", () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			expect(screen.getByText("Hi, how are you?")).toBeInTheDocument();
			expect(screen.getByText("I'm good, thanks!")).toBeInTheDocument();
		});

		it("should show loading state for messages", () => {
			mockUseConversationMessages.mockReturnValue({
				data: undefined,
				isLoading: true,
				refetch: vi.fn(),
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			const loadingElements = screen.getAllByRole("status");
			expect(loadingElements.length).toBeGreaterThan(0);
		});

		it("should show empty messages state", () => {
			mockUseConversationMessages.mockReturnValue({
				data: { data: [], pagination: {} },
				isLoading: false,
				refetch: vi.fn(),
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			expect(
				screen.getByText("Inicie a conversa enviando uma mensagem")
			).toBeInTheDocument();
		});
	});

	describe("Search Functionality", () => {
		it("should filter conversations based on search query", async () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			const searchInput = screen.getByPlaceholderText("Buscar no chat");
			await userEvent.type(searchInput, "Jane");

			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.queryByText("Bob Johnson")).not.toBeInTheDocument();
		});

		it("should search in message content", async () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			const searchInput = screen.getByPlaceholderText("Buscar no chat");
			await userEvent.type(searchInput, "Thanks");

			expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
			expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
		});

		it("should show no results when search has no matches", async () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			const searchInput = screen.getByPlaceholderText("Buscar no chat");
			await userEvent.type(searchInput, "NonExistentText");

			expect(
				screen.getByText("Nenhuma conversa encontrada")
			).toBeInTheDocument();
		});
	});

	describe("Message Sending", () => {
		it("should send a message", async () => {
			const sendMessageMock = vi.fn().mockResolvedValue({
				id: "msg-new",
				conversationId: "conv-1",
			});
			mockUseSendMessage.mockReturnValue({
				mutateAsync: sendMessageMock,
				isPending: false,
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			const messageInput = screen.getByPlaceholderText(
				"Digite sua mensagem..."
			);
			await userEvent.type(messageInput, "New message");

			const sendButton = screen.getByLabelText("Enviar mensagem");
			fireEvent.click(sendButton);

			await waitFor(() => {
				expect(sendMessageMock).toHaveBeenCalledWith({
					conversationId: "conv-1",
					receiverId: "user-2",
					content: "New message",
					type: "text",
				});
			});
		});

		it("should handle send message error", async () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const sendMessageMock = vi
				.fn()
				.mockRejectedValue(new Error("Send failed"));
			mockUseSendMessage.mockReturnValue({
				mutateAsync: sendMessageMock,
				isPending: false,
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			const messageInput = screen.getByPlaceholderText(
				"Digite sua mensagem..."
			);
			await userEvent.type(messageInput, "Failed message");

			const sendButton = screen.getByLabelText("Enviar mensagem");
			fireEvent.click(sendButton);

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith(
					"Error sending message:",
					expect.any(Error)
				);
			});

			consoleSpy.mockRestore();
		});

		it("should disable input when sending", () => {
			mockUseSendMessage.mockReturnValue({
				mutateAsync: vi.fn(),
				isPending: true,
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			const messageInput = screen.getByPlaceholderText("Enviando...");
			expect(messageInput).toBeDisabled();
		});
	});

	describe("Typing Indicator", () => {
		it("should send typing indicator when typing", async () => {
			const typingMock = vi.fn();
			mockUseSendTypingIndicator.mockReturnValue({
				mutate: typingMock,
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			const messageInput = screen.getByPlaceholderText(
				"Digite sua mensagem..."
			);
			await userEvent.type(messageInput, "T");

			await waitFor(() => {
				expect(typingMock).toHaveBeenCalledWith({
					conversationId: 1,
					isTyping: true,
				});
			});
		});

		it("should stop typing indicator after timeout", async () => {
			vi.useFakeTimers();
			const typingMock = vi.fn();
			mockUseSendTypingIndicator.mockReturnValue({
				mutate: typingMock,
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			const messageInput = screen.getByPlaceholderText(
				"Digite sua mensagem..."
			);
			await userEvent.type(messageInput, "Test");

			vi.advanceTimersByTime(3500);

			await waitFor(() => {
				expect(typingMock).toHaveBeenCalledWith({
					conversationId: 1,
					isTyping: false,
				});
			});

			vi.useRealTimers();
		});
	});

	describe("Proposal Modal", () => {
		it("should open proposal modal", async () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			const proposalButton = screen.getByText("Enviar Proposta");
			fireEvent.click(proposalButton);

			expect(screen.getByTestId("send-proposal-modal")).toBeInTheDocument();
		});

		it("should close proposal modal", async () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			const proposalButton = screen.getByText("Enviar Proposta");
			fireEvent.click(proposalButton);

			const closeButton = screen.getByText("Close Modal");
			fireEvent.click(closeButton);

			await waitFor(() => {
				expect(
					screen.queryByTestId("send-proposal-modal")
				).not.toBeInTheDocument();
			});
		});
	});

	describe("Tab Switching", () => {
		it("should switch between tabs", async () => {
			render(<MessagesTab />, { wrapper: createWrapper });

			const artistasTab = screen.getByText("Artistas");
			fireEvent.click(artistasTab);

			expect(artistasTab).toHaveClass("text-primary-600");

			const clientesTab = screen.getByText("Clientes");
			fireEvent.click(clientesTab);

			expect(clientesTab).toHaveClass("text-primary-600");
		});
	});

	describe("Message Formatting", () => {
		it("should format today's messages correctly", () => {
			const todayMessage: Message = {
				id: "msg-today",
				conversationId: "conv-1",
				senderId: "user-1",
				receiverId: "user-2",
				content: "Today's message",
				type: "text",
				status: "sent",
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			mockUseConversationMessages.mockReturnValue({
				data: {
					data: [todayMessage],
					pagination: {},
				},
				isLoading: false,
				refetch: vi.fn(),
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			const timeRegex = /\d{2}:\d{2}/;
			const timeElements = screen.getAllByText(timeRegex);
			expect(timeElements.length).toBeGreaterThan(0);
		});

		it("should show double check for read messages", () => {
			const readMessage: Message = {
				id: "msg-read",
				conversationId: "conv-1",
				senderId: "user-1",
				receiverId: "user-2",
				content: "Read message",
				type: "text",
				status: "read",
				createdAt: "2024-01-01T10:00:00Z",
				updatedAt: "2024-01-01T10:00:00Z",
			};

			mockUseConversationMessages.mockReturnValue({
				data: {
					data: [readMessage],
					pagination: {},
				},
				isLoading: false,
				refetch: vi.fn(),
			});

			render(<MessagesTab />, { wrapper: createWrapper });

			expect(screen.getByText(/✓✓/)).toBeInTheDocument();
		});
	});

	describe("File Upload", () => {
		it("should handle file upload", async () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			render(<MessagesTab />, { wrapper: createWrapper });

			const fileInput = document.querySelector('input[type="file"]');
			expect(fileInput).toBeInTheDocument();

			const file = new File(["test content"], "test.txt", {
				type: "text/plain",
			});

			if (fileInput) {
				fireEvent.change(fileInput, { target: { files: [file] } });
			}

			await waitFor(() => {
				expect(consoleSpy).toHaveBeenCalledWith(
					"File upload not yet implemented:",
					file
				);
			});

			consoleSpy.mockRestore();
		});
	});
});

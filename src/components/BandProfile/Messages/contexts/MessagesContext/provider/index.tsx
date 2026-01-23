import { PropsWithChildren } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useActiveMusicalProduct } from "@/hooks/useActiveMusicalProduct";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useConversations } from "@/hooks/useMessaging";
import { Conversation } from "../../../types";
import { useSignalRChat } from "@/hooks/useSignalRChat";
import { SignalRMessage } from "@/api/types";
import { SignalRService } from "@/api/services/signalRService";
import { MessagesContext } from "../context";
import { useMessages } from "../../../hooks/useMessages";

export const MessagesContextProvider = ({ children }: PropsWithChildren) => {
	const { playNotificationSound } = useMessages();

	const queryClient = useQueryClient();
	const { user, token } = useAuthStore();
	const currentUserId = user?.id;
	const { activeProduct } = useActiveMusicalProduct();
	const currentProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	// Check if user profile is complete for proposal functionality
	const { isProfileComplete } = useProfileStatus();
	const [searchQuery, setSearchQuery] = useState("");
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const [isNewConversationModalOpen, setIsNewConversationModalOpen] =
		useState(false);

	const [selectedConversation, setSelectedConversation] =
		useState<Conversation | null>(null);
	const [newConversationParticipant, setNewConversationParticipant] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [isProfileIncompleteModalOpen, setIsProfileIncompleteModalOpen] =
		useState(false);
	const [messageInput, setMessageInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	// Get conversations from API
	const { data: conversationsData, isLoading: conversationsLoading } =
		useConversations(currentProductId);

	// Transform API data to component format
	const conversations: Array<Conversation> =
		conversationsData?.data?.map((conv: any) => ({
			id: parseInt(conv.id, 0),
			contratanteName: conv.metadata?.contratanteNome || "Usuario Desconhecido",
			contratanteId: conv.metadata?.contratanteId || "Usuario Desconhecido",
			participantName: conv.metadata?.participantName || "Usuario Desconhecido",
			participantId: conv.metadata?.participantId || 0,
			lastMessage: conv.lastMessage?.content || "",
			lastMessageTime: conv.lastMessage?.createdAt || conv.updatedAt,
			unreadCount: conv.unreadCount || 0,
			isOnline: false, // This would need to be determined from online status API
		})) || [];

	// SignalR Chat Hook
	const {
		messages,
		isLoading,
		error,
		currentConversaId,
		sendMessage,
		markAsRead,
		enterConversation,
	} = useSignalRChat({
		onMessageReceived: (message) => {
			// Play notification sound
			playNotificationSound();

			// Update conversation list
			updateConversationWithNewMessage(message);

			// Show toast notification if not in focus
			if (document.hidden) {
				toast.info(
					`Nova mensagem de ${message.nomeRemetente || "Usuário desconhecido"}`,
					{
						description: message.conteudo.substring(0, 50) + "...",
					}
				);
			}
		},
		onMessageRead: () => {
			// Message read event handled
		},
		onNotification: (notification) => {
			toast.info(notification);
		},
	});

	// Enter existing conversation when selected
	useEffect(() => {
		if (selectedConversation && user) {
			console.log("🚀 Entering conversation:", selectedConversation.id);
			// For existing conversations, use enterConversation instead of initializeChat
			enterConversation(selectedConversation.id).catch((error) => {
				console.error("❌ Failed to enter conversation:", error);
			});
		} else {
			console.log(
				"⏸️ Not entering conversation - missing selectedConversation or user"
			);
		}
	}, [selectedConversation, user, enterConversation]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Mark messages as read when they become visible
	useEffect(() => {
		if (!messages.length || !user) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const messageElement = entry.target as HTMLElement;
						const messageId = parseInt(
							messageElement.dataset["messageId"] || "0"
						);
						const message = messages.find((m) => m.id === messageId);

						if (
							message &&
							currentUserId &&
							message.idRemetente !== currentUserId &&
							!message.lida
						) {
							markAsRead(messageId);
						}
					}
				});
			},
			{ threshold: 0.5 }
		);

		// Observe all message elements
		const messageElements =
			messagesContainerRef.current?.querySelectorAll("[data-message-id]");
		messageElements?.forEach((element) => {
			observer.observe(element);
		});

		return () => {
			observer.disconnect();
		};
	}, [messages, user, markAsRead]);

	// Filter conversations based on search
	const filteredConversations = conversations.filter((conversation) => {
		if (!searchQuery) return true;
		const searchLower = searchQuery.toLowerCase();
		return (
			conversation.participantName.toLowerCase().includes(searchLower) ||
			conversation.lastMessage?.toLowerCase().includes(searchLower)
		);
	});

	// Handle sending message
	const handleSendMessage = useCallback(
		async (content: string) => {
			if (!content.trim() || !currentConversaId) return;

			try {
				await sendMessage(content);
				setMessageInput("");
			} catch (error) {
				toast.error("Erro ao enviar mensagem");
			}
		},
		[currentConversaId, sendMessage]
	);

	// Update conversation list with new message
	const updateConversationWithNewMessage = (_message: SignalRMessage) => {
		// Invalidate conversations query to refetch updated data
		queryClient.invalidateQueries({ queryKey: ["messaging", "conversations"] });
	};

	const scrollToBottom = () => {
		try {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		} catch (error) {
			// Fallback for test environments where scrollIntoView might not be available
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
			}
		}
	};

	const [signalRService, setSignalRService] = useState<SignalRService | null>(
		null
	);

	useEffect(() => {
		if (signalRService === null) {
			setSignalRService(new SignalRService());
		} else {
			signalRService?.createConnection("chatHub", token!);

			signalRService?.on("ReceberMensagem", (mensagem) => {
				console.log("mensagem", mensagem);
			});
		}
	}, [signalRService]);

	return (
		<MessagesContext.Provider
			value={{
				error,
				messages,
				conversations,
				searchQuery,
				setSearchQuery,
				filteredConversations,
				isLoading,
				conversationsLoading,
				selectedConversation,
				setSelectedConversation,
				messageInput,
				setMessageInput,
				handleSendMessage,
				sendMessage,
				isProfileComplete,
				isProposalModalOpen,
				setIsProposalModalOpen,
				isNewConversationModalOpen,
				setIsNewConversationModalOpen,
				newConversationParticipant,
				setNewConversationParticipant,
				isProfileIncompleteModalOpen,
				setIsProfileIncompleteModalOpen,
				messagesContainerRef,
				messagesEndRef,
			}}
		>
			{children}
		</MessagesContext.Provider>
	);
};

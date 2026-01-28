import { PropsWithChildren, useMemo } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useActiveMusicalProduct } from "@/hooks/useActiveMusicalProduct";
import {
	messagingKeys,
	useConversationMessages,
	useConversations,
} from "@/hooks/useMessaging";
import { Conversation, Message } from "@/api/types";
import { MessagesContext } from "../context";
import { useChat } from "@/api/services/chat/useChat";
import { playNotificationSound } from "../../../utils/Message";

export const MessagesContextProvider = ({ children }: PropsWithChildren) => {
	const queryClient = useQueryClient();
	const { user } = useAuthStore();
	const { activeProduct } = useActiveMusicalProduct();
	const currentProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	const [messageInput, setMessageInput] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedConversation, setSelectedConversation] =
		useState<Conversation | null>(null);
	const [newConversationParticipant, setNewConversationParticipant] = useState<{
		id: number;
		name: string;
	} | null>(null);

	const [shouldLoadCurrentConversation, setShouldLoadCurrentConversation] =
		useState<boolean>(false);
	const [currentConversationId, setCurrentConversationId] = useState<
		number | null
	>(null);

	const [shouldLoadConversations, setShouldLoadConversations] =
		useState<boolean>(false);
	const [newMessages, setNewMessages] = useState<Message[]>([]);

	const { data: conversationsData, isLoading: isConversationsLoading } =
		useConversations(currentProductId, undefined, shouldLoadConversations);

	const filteredConversations: Conversation[] = useMemo(() => {
		return (
			conversationsData?.data?.map((conv) => {
				return {
					id: conv.id,
					contratanteId: conv.contratanteId || 0,
					contratanteNome: conv.contratanteNome || "Usuario Desconhecido",
					participanteId: conv.participanteId || 0,
					participanteNome: conv.participanteNome || "Usuario Desconhecido",
					ultimaMensagem: conv.ultimaMensagem,
					dataEnvio: conv.ultimaMensagem?.dataEnvio || "",
					numeroNaoLidas: conv.numeroNaoLidas || 0,
					isOnline: false, // This would need to be determined from online status API
				};
			}) || ([] as Conversation[])
		).filter((conversation) => {
			if (!searchQuery) return true;
			const searchLower = searchQuery.toLowerCase();
			return (
				conversation.participanteNome.toLowerCase().includes(searchLower) ||
				conversation.ultimaMensagem?.conteudo
					.toLowerCase()
					.includes(searchLower)
			);
		});
	}, [conversationsData, searchQuery]);

	const {
		data: historyMessages,
		isLoading: isMessagesLoading,
		error: messagesError,
	} = useConversationMessages(
		currentConversationId || 0,
		undefined,
		shouldLoadCurrentConversation
	);

	const [messages, setMessages] = useState<Array<Message>>([]);

	const {
		connect,
		sendMessage,
		enterConversation,
		markMessageAsRead,
		addReceiveMessageHandler,
		addMessageReadHandler,
		addNotificationHandler,
	} = useChat(
		currentConversationId || 0,
		setCurrentConversationId,
		setShouldLoadCurrentConversation,
		setShouldLoadConversations
	);
	const [connected, setConnected] = useState<boolean>(false);

	useEffect(() => {
		if (connected) {
			console.log("Setting up WebSocket handlers");
			addReceiveMessageHandler(handleReceiveMessage);

			addMessageReadHandler(handleMessageRead);

			addNotificationHandler((notification: string) => {
				toast.info(notification);
			});
		}
	}, [connected, user, currentProductId]);

	useEffect(() => {
		handleConnect();
	}, []);

	const handleConnect = async () => {
		await connect();
		setConnected(true);
	};

	const handleEnterConversation = async (conversationId: number) => {
		if (conversationId === currentConversationId) return;
		setCurrentConversationId(conversationId);
		enterConversation(conversationId);
	};

	const handleSendMessage = async (content: string) => {
		if (!content.trim() || !currentConversationId) return;
		try {
			await sendMessage(content);
			setMessageInput("");
		} catch (error) {
			toast.error("Erro ao enviar mensagem");
		}
	};

	const handleReceiveMessage = (message: Message) => {
		// Play notification sound
		playNotificationSound();

		// Update conversation data in cache
		if (!messages.find((m) => m.id === message.id)) {
			setNewMessages((prevMessages) => [...prevMessages, message]);
		}

		// Update conversation list
		// updateConversationWithNewMessage(message);

		// Show toast notification if not in focus
		if (document.hidden) {
			toast.info(
				`Nova mensagem de ${message.idRemetente || "Usuário desconhecido"}`,
				{
					description: message.conteudo.substring(0, 50) + "...",
				}
			);
		}
	};

	const handleMarkMessageAsRead = async (messageId: number) => {
		if (messages.find((m) => m.id === messageId && m.lida)) return;
		try {
			await markMessageAsRead(messageId);
		} catch (error) {
			console.error("Erro ao marcar mensagem como lida:", error);
		}
	};

	const handleMessageRead = (messageId: number) => {
		messages.forEach((message) => {
			if (message.id === messageId) {
				message.lida = true;
			}
		});
	};

	// Enter existing conversation when selected
	useEffect(() => {
		if (
			selectedConversation &&
			user &&
			selectedConversation.id !== currentConversationId
		) {
			handleEnterConversation(selectedConversation.id);
			setShouldLoadCurrentConversation(true);
		}
	}, [selectedConversation, user, handleEnterConversation]);

	// Update conversation list with new message
	const updateConversationWithNewMessage = (_message: Message) => {
		// Invalidate conversations query to refetch updated data
		queryClient.invalidateQueries({ queryKey: ["messaging", "conversations"] });
	};

	const syncCache = () => {
		if (newMessages.length === 0) return;

		queryClient.setQueryData(
			messagingKeys.conversationMessages(currentConversationId || 0),
			(oldData: any) => ({
				...oldData,
				pages: [...newMessages, ...oldData.pages.slice(0, -1)],
			})
		);

		setNewMessages([]);
	};

	useEffect(() => {
		if (!historyMessages) return;
		const mappedHistory =
			historyMessages.pages.flatMap((page) => page.flatMap((msg) => msg)) ?? [];
		const combinedMessages = [
			...mappedHistory,
			...newMessages.filter(
				(nm) => !mappedHistory.some((hm) => hm.id === nm.id)
			),
		];
		combinedMessages.sort((a, b) => a.id - b.id);
		setMessages(combinedMessages);
	}, [historyMessages, newMessages]);

	return (
		<MessagesContext.Provider
			value={{
				messageInput,
				setMessageInput,
				messagesError,
				messages,
				searchQuery,
				setSearchQuery,
				filteredConversations,
				isMessagesLoading,
				isConversationsLoading,
				selectedConversation,
				setSelectedConversation,
				handleSendMessage,
				handleMarkMessageAsRead,
				newConversationParticipant,
				setNewConversationParticipant,
			}}
		>
			{children}
		</MessagesContext.Provider>
	);
};

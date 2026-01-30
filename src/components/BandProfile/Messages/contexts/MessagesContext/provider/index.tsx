import { PropsWithChildren, useCallback, useMemo, useRef } from "react";
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
import { MessagesContext } from "../context";
import { useChat } from "@/api/services/chat/useChat";
import { playNotificationSound } from "../../../utils/Message";
import { Conversation, Message } from "@/api/services/messages/types";

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
	const currentConversationId = useRef<number | null>(null);

	const [shouldLoadConversations, setShouldLoadConversations] =
		useState<boolean>(false);
	const [newMessages, setNewMessages] = useState<Message[]>([]);

	const { data: conversationsData, isLoading: isConversationsLoading } =
		useConversations(currentProductId, undefined, shouldLoadConversations);

	const filteredConversations: Conversation[] = useMemo(() => {
		return (
			conversationsData?.filter((conversation) => {
				if (!searchQuery) return true;
				const searchLower = searchQuery.toLowerCase();
				return (
					conversation.participanteNome.toLowerCase().includes(searchLower) ||
					conversation.ultimaMensagem?.conteudo
						.toLowerCase()
						.includes(searchLower)
				);
			}) || []
		);
	}, [conversationsData, searchQuery]);

	const {
		data: historyMessages,
		isLoading: isMessagesLoading,
		error: messagesError,
	} = useConversationMessages(
		currentConversationId.current || 0,
		undefined,
		shouldLoadCurrentConversation
	);

	const [messages, setMessages] = useState<Array<Message>>([]);

	const {
		connect,
		start,
		sendMessage,
		enterConversation,
		markMessageAsRead,
		addReceiveMessageHandler,
		addMessageReadHandler,
		addNotificationHandler,
		addOnCloseHandler,
		removeHandlers,
	} = useChat(
		currentConversationId,
		setShouldLoadCurrentConversation,
		setShouldLoadConversations
	);

	const handleConnect = useCallback(async () => {
		connect();

		addReceiveMessageHandler(handleReceiveMessage);

		addMessageReadHandler(handleMessageRead);

		addNotificationHandler((notification: string) => {
			toast.info(notification);
		});

		addOnCloseHandler((error?: Error) => {
			console.error("Conexão do chat fechada:", error);
		});

		await start();
	}, [connect, start]);

	const handleEnterConversation = async (conversationId: number) => {
		if (conversationId === currentConversationId.current) return;
		currentConversationId.current = conversationId;
		enterConversation(conversationId);
	};

	const handleSendMessage = async (content: string) => {
		if (!content.trim() || !currentConversationId.current) return;
		try {
			await sendMessage(content);
			setMessageInput("");
		} catch (error) {
			toast.error("Erro ao enviar mensagem");
		}
	};

	const handleReceiveMessage = useCallback(
		(message: Message) => {
			if (message.idConversa === currentConversationId.current) {
				// Play notification sound
				playNotificationSound();

				// Update conversation data in cache
				if (!newMessages.find((m) => m.id === message.id)) {
					setNewMessages((prevMessages) => [...prevMessages, message]);
				}

				// Update conversation list
				updateConversationWithNewMessage(message);

				// Show toast notification if not in focus
				if (document.hidden) {
					toast.info(
						`Nova mensagem de ${message.idRemetente || "Usuário desconhecido"}`,
						{
							description: message.conteudo.substring(0, 50) + "...",
						}
					);
				}
			}
		},
		[newMessages, setNewMessages, currentConversationId.current]
	);

	const handleMarkMessageAsRead = useCallback(
		async (messageId: number) => {
			if (messages.find((m) => m.id === messageId && m.lida)) return;
			try {
				await markMessageAsRead(messageId);
			} catch (error) {
				console.error("Erro ao marcar mensagem como lida:", error);
			}
		},
		[messages, markMessageAsRead]
	);

	const handleMessageRead = useCallback(
		(messageId: number) => {
			setMessages((prev) =>
				prev.map((message) => {
					if (message.id === messageId) {
						message.lida = true;
					}
					return message;
				})
			);
		},
		[setMessages]
	);

	// Update conversation list with new message
	const updateConversationWithNewMessage = (_message: Message) => {
		// Invalidate conversations query to refetch updated data
		queryClient.invalidateQueries({
			queryKey: [...messagingKeys.conversations(), currentProductId],
		});
	};

	const syncCache = () => {
		if (newMessages.length === 0) return;

		queryClient.setQueryData(
			messagingKeys.conversationMessages(currentConversationId.current || 0),
			(oldData: any) => ({
				...oldData,
				pages: [...newMessages, ...oldData.pages.slice(0, -1)],
			})
		);

		setNewMessages([]);
	};

	// Enter existing conversation when selected
	useEffect(() => {
		if (
			selectedConversation &&
			user &&
			selectedConversation.id !== currentConversationId.current
		) {
			handleEnterConversation(selectedConversation.id);
			setShouldLoadCurrentConversation(true);
		}
	}, [selectedConversation, user, handleEnterConversation]);

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
	}, [historyMessages, newMessages, setMessages]);

	useEffect(() => {
		setNewMessages([]);
	}, [currentConversationId.current]);

	useEffect(() => {
		handleConnect();

		return () => {
			removeHandlers();
		};
	}, []);

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

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
import { Conversation, Message } from "@/api/services/messages/types";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { playNotificationSound } from "@/components/BandProfile/Messages/utils/Message";

export const MessagesContextProvider = ({ children }: PropsWithChildren) => {
	const queryClient = useQueryClient();
	const { user, token } = useAuthStore();
	const currentUserId = user?.id;
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
	const { isProfileComplete } = useProfileStatus();
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const [isNewConversationModalOpen, setIsNewConversationModalOpen] =
		useState(false);
	const [isProfileIncompleteModalOpen, setIsProfileIncompleteModalOpen] =
		useState(false);

	const [shouldLoadCurrentConversation, setShouldLoadCurrentConversation] =
		useState<boolean>(false);
	const currentConversationId = useRef<number | null>(null);

	const [shouldLoadConversations, setShouldLoadConversations] =
		useState<boolean>(true);
	const [newMessages, setNewMessages] = useState<Message[]>([]);

	const {
		data: conversationsData,
		isLoading: isConversationsLoading,
		refetch: refetchConversations,
	} = useConversations(
		currentProductId,
		undefined,
		shouldLoadConversations && !!token
	);
	const [newConversationData, setNewConversationData] = useState<
		Conversation[]
	>([]);

	const [conversations, setConversations] = useState<Conversation[]>([]);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const allConversations = [
			...(conversationsData || []),
			...newConversationData,
		];
		setConversations(
			allConversations.sort((a, b) => {
				const dateA = a.ultimaMensagem?.dataEnvio
					? new Date(a.ultimaMensagem.dataEnvio).getTime()
					: 0;
				const dateB = b.ultimaMensagem?.dataEnvio
					? new Date(b.ultimaMensagem.dataEnvio).getTime()
					: 0;
				return dateB - dateA;
			})
		);
	}, [setConversations, conversationsData, newConversationData]);

	const filteredConversations = useMemo(() => {
		return (
			conversations.filter((conversation) => {
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
	}, [conversations, searchQuery]);

	const {
		data: historyMessages,
		isLoading: isMessagesLoading,
		error: messagesError,
		refetch: refetchMessages,
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
	} = useChat(currentConversationId, setShouldLoadConversations);

	const handleEnterConversation = async (conversationId: number) => {
		enterConversation(conversationId);
	};

	const conversationsRef = useRef<Conversation[]>(conversations);

	useEffect(() => {
		conversationsRef.current = conversations;
	}, [conversations]);

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

		conversationsRef.current.forEach(async (conversation) => {
			await enterConversation(conversation.id);
		});
	}, [connect, start]);

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

			// Update conversation list
			updateConversationWithNewMessage(message);
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

			setLastMessageAsRead(messageId);
		},
		[messages, setMessages]
	);

	const setLastMessageAsRead = useCallback(
		(messageId: number) => {
			setConversations((prevConversations) =>
				prevConversations.map((conversation) => {
					if (conversation.ultimaMensagem?.id === messageId) {
						conversation.ultimaMensagem.lida = true;
						if (conversation.contratanteId === currentUserId) {
							conversation.numeroMensagensNãoLidasContratante = 0;
						} else {
							conversation.numeroMensagensNãoLidasContratado = 0;
						}
					}
					return conversation;
				})
			);
		},
		[setConversations]
	);

	// Update conversation list with new message
	const updateConversationWithNewMessage = useCallback(
		(message: Message) => {
			setNewConversationData((prevConversations) => {
				const conversationIndex = prevConversations.findIndex(
					(c) => c.id === message.idConversa
				);

				if (conversationIndex !== -1) {
					const conversationToUpdate = prevConversations.find(
						(c) => c.id === message.idConversa
					);
					if (!conversationToUpdate) return prevConversations;

					const updatedConversation = {
						...conversationToUpdate,
						ultimaMensagem: message,
					};
					console.log([
						...prevConversations.splice(conversationIndex, 1),
						updatedConversation,
					]);
					return [
						...prevConversations.splice(conversationIndex, 1),
						updatedConversation,
					];
				} else {
					refetchConversations();
				}
				return prevConversations;
			});
		},
		[setNewConversationData, currentUserId]
	);

	// const syncCache = () => {
	// 	if (newMessages.length === 0 && newConversationData.length === 0) return;

	// 	// queryClient.setQueryData(
	// 	// 	[...messagingKeys.conversations(), currentProductId],
	// 	// 	(oldData: any) => {
	// 	// 		if (!oldData) return oldData;
	// 	// 		const updatedConversations = oldData.map(
	// 	// 			(conversation: Conversation) => {
	// 	// 				if (conversation.id === message.idConversa) {
	// 	// 					return {
	// 	// 						...conversation,
	// 	// 						ultimaMensagem: {
	// 	// 							...message,
	// 	// 							numeroNaoLidas: conversation.numeroNaoLidas
	// 	// 								? conversation.numeroNaoLidas + 1
	// 	// 								: 1,
	// 	// 						},
	// 	// 					};
	// 	// 				}
	// 	// 				return conversation;
	// 	// 			}
	// 	// 		);
	// 	// 		return updatedConversations;
	// 	// 	}
	// 	// );
	// 	// setNewConversations([]);

	// 	queryClient.setQueryData(
	// 		messagingKeys.conversationMessages(currentConversationId.current || 0),
	// 		(oldData: any) => ({
	// 			...oldData,
	// 			pages: [...newMessages, ...oldData.pages.slice(0, -1)],
	// 		})
	// 	);
	// 	setNewMessages([]);
	// };

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

	// Mark messages as read when they become visible
	useEffect(() => {
		if (!messages || !messages.length || !user) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const messageElement = entry.target as HTMLElement;
						const messageId = parseInt(
							messageElement.dataset["messageId"] || "0"
						);
						const message = messages.find((m: Message) => m.id === messageId);

						if (
							message &&
							currentUserId &&
							message.idRemetente !== currentUserId &&
							!message.lida
						) {
							handleMarkMessageAsRead(messageId);
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
	}, [messages, user, handleMarkMessageAsRead]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Enter existing conversation when selected
	useEffect(() => {
		if (
			selectedConversation &&
			user &&
			selectedConversation.id !== currentConversationId.current
		) {
			currentConversationId.current = selectedConversation.id;
			setShouldLoadCurrentConversation(true);
			queryClient.invalidateQueries({
				queryKey: messagingKeys.conversationMessages(selectedConversation.id),
			});
			refetchMessages();
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
		if (token && !isConversationsLoading) {
			handleConnect();
		}

		return () => {
			if (token) {
				removeHandlers();
			}
		};
	}, [token, isConversationsLoading]);

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
				conversations,
				isMessagesLoading,
				isConversationsLoading,
				selectedConversation,
				setSelectedConversation,
				handleSendMessage,
				handleMarkMessageAsRead,
				newConversationParticipant,
				setNewConversationParticipant,
				isProfileComplete,
				isProposalModalOpen,
				setIsProposalModalOpen,
				isNewConversationModalOpen,
				setIsNewConversationModalOpen,
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

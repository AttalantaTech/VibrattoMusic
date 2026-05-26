/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { playNotificationSound } from "@/components/BandProfile/Messages/utils/Message";
import type { Message } from "@/api/services/messages/types";

import type { UseMessagesRealtimeProps } from "../types";

export const useMessagesRealtime = ({
	chatConnection,
	currentConversationId,
	newMessages,
	setNewMessages,
	setMessages,
	setNewConversationData,
	refetchConversations,
	setConversations,
	setMessageInput,
	messages,
}: UseMessagesRealtimeProps) => {
	const {
		connect,
		start,
		enterConversation,
		addReceiveMessageHandler,
		addMessageReadHandler,
		addNotificationHandler,
		addOnCloseHandler,
		removeHandlers,
		sendMessage,
		markMessageAsRead,
	} = chatConnection;

	const updateConversationWithNewMessage = useCallback(
		(message: Message) => {
			setNewConversationData((previousConversations) => {
				const conversationIndex = previousConversations.findIndex(
					(c) => c.id === message.idConversa
				);

				if (conversationIndex !== -1) {
					const conversationToUpdate = previousConversations.find(
						(c) => c.id === message.idConversa
					);
					if (!conversationToUpdate) return previousConversations;

					const updatedConversation = {
						...conversationToUpdate,
						ultimaMensagem: message,
					};

					return [
						...previousConversations.splice(conversationIndex, 1),
						updatedConversation,
					];
				} else {
					void refetchConversations();
				}
				return previousConversations;
			});
		},
		[refetchConversations]
	);

	const handleReceiveMessage = useCallback(
		(message: Message) => {
			if (message.idConversa === currentConversationId) {
				// Play notification sound
				playNotificationSound();

				// Update conversation data in cache
				if (!newMessages.find((m) => m.id === message.id)) {
					setNewMessages((previousMessages) => [...previousMessages, message]);
				}

				// Show toast notification if not in focus
				if (document.hidden) {
					toast.info(
						`Nova mensagem de ${message.nomeRemetente || message.idRemetente || "Usuário desconhecido"}`,
						{
							description:
								message.conteudo.substring(0, 50) +
								(message.conteudo.length > 50 ? "..." : ""),
						}
					);
				}
			}

			// Update conversation list
			updateConversationWithNewMessage(message);
		},
		[updateConversationWithNewMessage, newMessages]
	);

	const setLastMessageAsRead = useCallback(
		(messageId: number) => {
			setConversations((previousConversations) =>
				previousConversations.map((conversation) => {
					if (conversation.ultimaMensagem?.id === messageId) {
						return {
							...conversation,
							ultimaMensagem: {
								...conversation.ultimaMensagem,
								lida: true,
							},
							numeroMensagensNaoLidas: 0,
						};
					}
					return conversation;
				})
			);
		},
		[setConversations]
	);

	const handleMessageRead = useCallback(
		(messageId: number) => {
			setMessages((previous) =>
				previous.map((message) => {
					if (message.id === messageId) {
						message.lida = true;
					}

					return message;
				})
			);

			setLastMessageAsRead(messageId);
		},
		[setLastMessageAsRead]
	);

	const handleEnterConversation = useCallback(
		async (conversationId: number) => {
			await enterConversation(conversationId).catch((error) => {
				console.error("Erro ao entrar na conversa:", error);
			});
		},
		[enterConversation]
	);

	const handleSendMessage = async (
		content: string,
		senderType: number,
		idMusicalProduct: number | null
	) => {
		if (!content.trim() || !currentConversationId) return;
		try {
			await sendMessage(content, senderType, idMusicalProduct);
			setMessageInput("");
		} catch (error) {
			console.error("Erro ao enviar mensagem:", error);
			toast.error("Erro ao enviar mensagem");
		}
	};

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

	useEffect(() => {
		connect();

		start().catch(console.error);

		addReceiveMessageHandler(handleReceiveMessage);
		addMessageReadHandler(handleMessageRead);

		addNotificationHandler((notification: string) => {
			toast.info(notification);
		});

		addOnCloseHandler((error?: Error) => {
			console.error("Conexão encerrada:", error);
		});

		return () => {
			removeHandlers();
		};
	}, [
		addReceiveMessageHandler,
		addMessageReadHandler,
		addNotificationHandler,
		addOnCloseHandler,
		connect,
		handleMessageRead,
		handleReceiveMessage,
		removeHandlers,
		start,
	]);

	return {
		handleEnterConversation,
		handleMarkMessageAsRead,
		handleSendMessage,
	};
};

import { useAuthStore } from "@/store/authStore";
import { apiClient } from "../../core/client";
import { SignalRService } from "../../websocket/SignalRService";
import { WebSocketI } from "@/api/websocket/WebSocketI";
import { Message, SignalRMessage } from "@/api/types";
import { Dispatch, SetStateAction, useState } from "react";

export const useChat = (
	currentConversationId: number,
	setCurrentConversationId: Dispatch<SetStateAction<number | null>>,
	setShouldLoadCurrentConversation: Dispatch<SetStateAction<boolean>>,
	setShouldLoadConversations: Dispatch<SetStateAction<boolean>>
) => {
	const { token } = useAuthStore();
	if (!token) {
		throw new Error("User is not authenticated");
	}
	const [connection, setConnection] = useState<WebSocketI | null>(null);

	const connect = async (): Promise<void> => {
		if (!connection) {
			const newConnection = new SignalRService();
			await newConnection.createConnection("chatHub", token);
			setConnection(newConnection);
		}
	};

	const startLoadingConversations = (): void => {
		setShouldLoadConversations(true);
	};

	const stopLoadingConversations = (): void => {
		setShouldLoadConversations(false);
	};

	const enterConversation = async (conversationId: number): Promise<void> => {
		setCurrentConversationId(conversationId);

		if (connection?.isConnected()) {
			await connection.invoke("EntrarConversa", conversationId);
			setShouldLoadCurrentConversation(false);
		} else {
			setShouldLoadCurrentConversation(true);
		}
	};

	const sendMessage = async (content: string): Promise<void> => {
		if (connection?.isConnected()) {
			await connection.invoke("EnviarMensagem", currentConversationId, content);
			return;
		}

		await sendMessageViaREST(content);
	};

	const markMessageAsRead = async (messageId: number): Promise<void> => {
		if (connection?.isConnected()) {
			await connection.invoke("MarcarMensagemComoLida", messageId);
			return;
		}
		await markMessageAsReadViaREST(messageId);
	};

	const addReceiveMessageHandler = (
		handler: (message: Message) => void
	): void => {
		connection?.on("ReceberMensagem", (message: SignalRMessage) => {
			const convertedMessage: Message = {
				id: message.idMensagem,
				idConversa: message.idConversa,
				conteudo: message.conteudo,
				idRemetente: message.idRemetente,
				dataEnvio: Date.now().toString(),
				lida: false,
			};
			handler(convertedMessage);
		});
	};

	const addMessageReadHandler = (
		handler: (messageId: number) => void
	): void => {
		connection?.on("MensagemLida", handler);
	};

	const addNotificationHandler = (
		handler: (notification: string) => void
	): void => {
		connection?.on("Notificar", handler);
	};

	const sendMessageViaREST = async (content: string): Promise<void> => {
		await apiClient.post("chat/mensagem", {
			IdConversa: currentConversationId,
			Conteudo: content,
		});
	};

	const markMessageAsReadViaREST = async (messageId: number): Promise<void> => {
		await apiClient.post(`chat/lida/${messageId}`, {});
	};

	const isConnected = (): boolean => {
		return connection?.isConnected() || false;
	};

	return {
		connect,
		isConnected,
		startLoadingConversations,
		stopLoadingConversations,
		enterConversation,
		sendMessage,
		markMessageAsRead,
		addReceiveMessageHandler,
		addMessageReadHandler,
		addNotificationHandler,
	};
};

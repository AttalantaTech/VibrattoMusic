import { useAuthStore } from "@/store/authStore";
import { apiClient } from "../../core/client";
import { SignalRService } from "../../websocket/SignalRService";
import type { WebSocketI } from "@/api/websocket/WebSocketI";
import type { Dispatch, SetStateAction } from "react";
import { useRef } from "react";
import type {
	WebSocketEvent,
	WebSocketEventHandler,
} from "@/api/websocket/types";
import type { Message } from "../messages/types";

export const useChat = (
	currentConversationIdRef: React.MutableRefObject<number | null>,
	setShouldLoadConversations: Dispatch<SetStateAction<boolean>>
) => {
	const { token } = useAuthStore();
	const connection = useRef<WebSocketI | null>(null);

	const handlers = useRef<Map<WebSocketEvent, WebSocketEventHandler>>(
		new Map()
	);

	const connect = () => {
		if (!connection.current && token) {
			const newConnection = new SignalRService();
			newConnection.createConnection("chatHub", token);
			connection.current = newConnection;
		}
	};

	const start = async (): Promise<void> => {
		if (connection.current && !connection.current.isConnected()) {
			await connection.current.start();
		}
	};

	const stop = async (): Promise<void> => {
		if (connection.current && connection.current.isConnected()) {
			await connection.current.stop();
		}
	};

	const startLoadingConversations = (): void => {
		setShouldLoadConversations(true);
	};

	const stopLoadingConversations = (): void => {
		setShouldLoadConversations(false);
	};

	const enterConversation = async (conversationId: number): Promise<void> => {
		if (connection.current?.isConnected()) {
			await connection.current.invoke("EntrarConversa", conversationId);
		}
	};

	const sendMessageViaREST = async (
		content: string,
		senderType: number,
		idMusicalProduct: number | null
	): Promise<void> => {
		await apiClient.get(`chat/mensagem?`, {
			params: {
				idConversa: currentConversationIdRef.current || 0,
				conteudo: content,
				tipoRemetente: senderType,
				idProdutoMusical: idMusicalProduct,
			},
		});
	};

	const sendMessage = async (
		content: string,
		senderType: number,
		idMusicalProduct: number | null
	): Promise<void> => {
		if (connection.current) {
			try {
				await connection.current.invoke(
					"EnviarMensagem",
					currentConversationIdRef.current || 0,
					content,
					senderType,
					idMusicalProduct
				);
				return;
			} catch (error) {
				console.error(error);
			}
		}

		await sendMessageViaREST(content, senderType, idMusicalProduct);
	};

	const markMessageAsReadViaREST = async (messageId: number): Promise<void> => {
		await apiClient.post(`chat/lida/${messageId}`, {});
	};

	const markMessageAsRead = async (messageId: number): Promise<void> => {
		if (connection.current?.isConnected()) {
			await connection.current.invoke("MarcarMensagemComoLida", messageId);
			return;
		}
		await markMessageAsReadViaREST(messageId);
	};

	const addReceiveMessageHandler = (
		handler: (message: Message) => void
	): void => {
		handlers.current.set("ReceberMensagem", handler);
		connection.current?.on("ReceberMensagem", handler);
	};

	const addMessageReadHandler = (
		handler: (messageId: number) => void
	): void => {
		handlers.current.set("MensagemLida", handler);
		connection.current?.on("MensagemLida", handler);
	};

	const addNotificationHandler = (
		handler: (notification: string) => void
	): void => {
		handlers.current.set("Notificar", handler);
		connection.current?.on("Notificar", handler);
	};

	const addOnCloseHandler = (handler: (error?: Error) => void): void => {
		connection.current?.onclose(handler);
	};

	const removeHandlers = (): void => {
		handlers.current.forEach((handler, event) => {
			connection.current?.off(event, handler);
		});
		handlers.current.clear();
	};

	const isConnected = (): boolean => {
		return connection.current?.isConnected() || false;
	};

	return {
		connect,
		start,
		stop,
		isConnected,
		startLoadingConversations,
		stopLoadingConversations,
		enterConversation,
		sendMessage,
		markMessageAsRead,
		addReceiveMessageHandler,
		addMessageReadHandler,
		addNotificationHandler,
		addOnCloseHandler,
		removeHandlers,
	};
};

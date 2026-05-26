import { useEffect } from "react";
import type { Message } from "@/api/services/messages/types";
import type { UseMessagesObserverProps } from "../types";

export const useMessagesObserver = ({
	messages,
	user,
	currentUserId,
	messagesContainerRef,
	handleMarkMessageAsRead,
	messagesEndRef,
}: UseMessagesObserverProps) => {
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
							handleMarkMessageAsRead(messageId).catch((error) => {
								console.error("Erro ao marcar mensagem como lida:", error);
							});
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
	}, [
		messages,
		user,
		handleMarkMessageAsRead,
		currentUserId,
		messagesContainerRef,
	]);

	const scrollToBottom = () => {
		try {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		} catch {
			// Fallback for test environments where scrollIntoView might not be available
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
			}
		}
	};

	return { scrollToBottom };
};

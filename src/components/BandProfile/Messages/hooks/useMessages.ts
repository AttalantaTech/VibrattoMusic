import { Message } from "@/api/types";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useRef, useState } from "react";
import { useMessagesContext } from "../contexts/MessagesContext";

export const useMessages = () => {
	const { user } = useAuthStore();
	const currentUserId = user?.id;

	const { messages, handleMarkMessageAsRead } = useMessagesContext();

	// Check if user profile is complete for proposal functionality
	const { isProfileComplete } = useProfileStatus();
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const [isNewConversationModalOpen, setIsNewConversationModalOpen] =
		useState(false);
	const [isProfileIncompleteModalOpen, setIsProfileIncompleteModalOpen] =
		useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);

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

	return {
		isProfileComplete,
		isProposalModalOpen,
		setIsProposalModalOpen,
		isNewConversationModalOpen,
		setIsNewConversationModalOpen,
		isProfileIncompleteModalOpen,
		setIsProfileIncompleteModalOpen,
		messagesContainerRef,
		messagesEndRef,
	};
};

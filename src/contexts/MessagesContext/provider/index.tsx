/* eslint-disable react-hooks/exhaustive-deps */
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

import { MessagesContext } from "../context";
import { useChatConnection } from "@/api/services/chat/useChatConnection";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import type { ChatUser } from "../types";
import { useMessagesQueries } from "../hooks/useMessagesQueries";
import { mapConversations } from "../utils/mapConversations";
import { mergeMessages } from "../utils/mergeMessages";
import { mapMessages } from "../utils/mapMessages";
import { useMessagesUI } from "../hooks/useMessagesUI";
import { useMessagesRealtime } from "../hooks/useMessagesRealtime";
import { useMessagesObserver } from "../hooks/useMessagesObserver";
import { useConversationState } from "../hooks/state/useConversationState";
import { useMessagesInputState } from "../hooks/state/useMessagesInputState";
import { useMessagesModalState } from "../hooks/state/useMessagesModalState";
import { useMessagesRefs } from "../hooks/state/useMessagesRefs";

export const MessagesProvider = ({ children }: PropsWithChildren) => {
	const { user, token } = useAuthStore();
	const { isProfileComplete } = useProfileStatus();
	const { activeProduct } = useMusicalProductStore();

	const currentUserId = user?.id;
	const currentProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	const currentChatUser: ChatUser = activeProduct
		? {
				id: activeProduct.id,
				name: activeProduct.nome,
				type: "product" as const,
			}
		: {
				id: user?.id || 0,
				name: user?.nome || "Usuário",
				type: "user" as const,
				isContractor: true,
			};

	const {
		searchQuery,
		setSearchQuery,
		messages,
		setMessages,
		messageInput,
		setMessageInput,
		newMessages,
		setNewMessages,
	} = useMessagesInputState();

	const {
		conversations,
		setConversations,
		newConversationData,
		setNewConversationData,
		currentConversationId,
		setCurrentConversationId,
		selectedConversation,
		setSelectedConversation,
		newConversationParticipant,
		setNewConversationParticipant,
	} = useConversationState();

	const {
		isProposalModalOpen,
		setIsProposalModalOpen,
		isNewConversationModalOpen,
		setIsNewConversationModalOpen,
		isProfileIncompleteModalOpen,
		setIsProfileIncompleteModalOpen,
		shouldLoadCurrentConversation,
		setShouldLoadCurrentConversation,
		shouldLoadConversations,
		setShouldLoadConversations,
	} = useMessagesModalState();

	const { messagesEndRef, messagesContainerRef, conversationsRef } =
		useMessagesRefs(conversations);

	const {
		conversationsData,
		isConversationsLoading,
		refetchConversations,
		invalidateConversationMessages,
		historyMessages,
		isMessagesLoading,
		messagesError,
	} = useMessagesQueries({
		currentConversationId,
		shouldLoadConversations,
		shouldLoadCurrentConversation,
		currentProductId,
		token,
	});

	const chatConnection = useChatConnection(
		currentConversationId,
		setShouldLoadConversations
	);

	const { filteredConversations } = useMessagesUI({
		conversations,
		searchQuery,
	});

	const {
		handleEnterConversation,
		handleMarkMessageAsRead,
		handleSendMessage,
	} = useMessagesRealtime({
		chatConnection,
		conversations,
		currentConversationId,
		newMessages,
		refetchConversations,
		setConversations,
		messages,
		setMessages,
		setNewConversationData,
		setNewMessages,
		setMessageInput,
	});

	const { scrollToBottom } = useMessagesObserver({
		handleMarkMessageAsRead,
		messages,
		messagesContainerRef,
		user,
		currentUserId,
		messagesEndRef,
	});

	useEffect(() => {
		try {
			const uniqueConversations = mapConversations(
				conversationsData ?? [],
				newConversationData
			);

			setConversations(uniqueConversations);
		} catch (error) {
			console.error("Erro ao ordenar conversas:", error);
			setConversations([...(conversationsData || []), ...newConversationData]);
		}
	}, [setConversations, conversationsData, newConversationData]);

	useEffect(() => {
		conversationsRef.current = conversations;
	}, [conversations]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Enter existing conversation when selected
	useEffect(() => {
		const handleInvalidadeConversation = async () => {
			if (
				selectedConversation &&
				user &&
				selectedConversation.id !== currentConversationId
			) {
				setCurrentConversationId(selectedConversation.id);
				setShouldLoadCurrentConversation(true);

				await invalidateConversationMessages(selectedConversation.id);
			}
		};

		void handleInvalidadeConversation();
	}, [
		selectedConversation,
		user,
		handleEnterConversation,
		invalidateConversationMessages,
	]);

	useEffect(() => {
		if (!historyMessages) return;
		const mappedHistory = mapMessages(historyMessages);

		const combinedMessages = mergeMessages(mappedHistory, newMessages);
		setMessages(combinedMessages);
	}, [historyMessages, newMessages, setMessages]);

	useEffect(() => {
		setNewMessages([]);
	}, [currentConversationId]);

	return (
		<MessagesContext.Provider
			value={{
				currentChatUser,
				searchQuery,
				setSearchQuery,
				messages,
				messageInput,
				setMessageInput,
				messagesError,
				filteredConversations,
				conversations,
				selectedConversation,
				setSelectedConversation,
				newConversationParticipant,
				setNewConversationParticipant,
				isProfileComplete,
				isMessagesLoading,
				isConversationsLoading,
				isProposalModalOpen,
				isNewConversationModalOpen,
				isProfileIncompleteModalOpen,
				setIsProposalModalOpen,
				setIsNewConversationModalOpen,
				setIsProfileIncompleteModalOpen,
				handleSendMessage,
				handleMarkMessageAsRead,
				messagesContainerRef,
				messagesEndRef,
				scrollToBottom,
			}}
		>
			{children}
		</MessagesContext.Provider>
	);
};

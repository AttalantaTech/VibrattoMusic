import {
	messagingKeys,
	useConversationMessages,
	useConversations,
} from "@/hooks/useMessaging";
import type { UseMessagesQueriesProps } from "../types";
import { useQueryClient } from "@tanstack/react-query";

export const useMessagesQueries = ({
	currentConversationId,
	currentProductId,
	shouldLoadConversations,
	shouldLoadCurrentConversation,
	token,
}: UseMessagesQueriesProps) => {
	const queryClient = useQueryClient();

	const {
		data: conversationsData,
		isLoading: isConversationsLoading,
		refetch: refetchConversations,
	} = useConversations(
		currentProductId,
		undefined,
		shouldLoadConversations && !!token
	);

	const {
		data: historyMessages,
		isLoading: isMessagesLoading,
		error: messagesError,
		refetch: refetchMessages,
	} = useConversationMessages(
		currentConversationId || 0,
		undefined,
		shouldLoadCurrentConversation
	);

	const invalidateConversationMessages = async (conversationId: number) => {
		await queryClient.invalidateQueries({
			queryKey: messagingKeys.conversationMessages(conversationId),
		});
		await refetchMessages();
	};

	return {
		conversationsData,
		isConversationsLoading,
		refetchConversations,
		invalidateConversationMessages,
		historyMessages,
		isMessagesLoading,
		refetchMessages,
		messagesError,
	};
};

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
	} = useConversations({
		IdProdutoMusical: currentProductId,
		enabled: shouldLoadConversations && !!token,
	});

	const {
		data: historyMessages,
		isLoading: isMessagesLoading,
		error: messagesQueryError,
		refetch: refetchMessages,
	} = useConversationMessages(
		currentConversationId || 0,
		undefined,
		shouldLoadCurrentConversation
	);

	// A refresh that fails keeps the messages already loaded on screen; the
	// error only shows when there is nothing to show
	const messagesError = historyMessages ? null : messagesQueryError;

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

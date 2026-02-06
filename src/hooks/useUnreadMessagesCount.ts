import { useMemo } from "react";
import { useConversations } from "./useMessaging";

/**
 * Hook to get the total count of unread messages across all conversations
 * Updates every 5 seconds for real-time feel
 */
export const useUnreadMessagesCount = () => {
	const conversations = useConversations(undefined, true);

	const totalUnreadMessages = useMemo(() => {
		if (!conversations.data?.data) return 0;

		return conversations.data.data.reduce(
			(total, conversation) => total + (conversation.unreadCount || 0),
			0
		);
	}, [conversations.data?.data]);

	return {
		totalUnreadMessages,
		isLoading: conversations.isLoading,
		error: conversations.error,
	};
};

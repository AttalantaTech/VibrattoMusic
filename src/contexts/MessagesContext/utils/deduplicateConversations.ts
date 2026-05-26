import type { Conversation } from "@/api/services/messages/types";

export const deduplicateConversations = (
	conversations: Array<Conversation>
) => {
	const uniqueIds = new Set<number>();

	return conversations.filter((conversation) => {
		if (uniqueIds.has(conversation.id)) {
			return false;
		}

		uniqueIds.add(conversation.id);

		return true;
	});
};

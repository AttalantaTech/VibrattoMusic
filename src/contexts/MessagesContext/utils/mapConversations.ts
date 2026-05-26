import type { Conversation } from "@/api/services/messages/types";
import { deduplicateConversations } from "./deduplicateConversations";
import { sortConversations } from "./sortConversations";

export const mapConversations = (
	conversationsData: Array<Conversation>,
	newConversationData: Array<Conversation>
) => {
	const allConversations = [...conversationsData, ...newConversationData];

	const uniqueConversations = deduplicateConversations(allConversations);

	return sortConversations(uniqueConversations);
};

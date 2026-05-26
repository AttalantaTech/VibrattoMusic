import type { Conversation } from "@/api/services/messages/types";
import { useState } from "react";

export const useConversationState = () => {
	const [conversations, setConversations] = useState<Array<Conversation>>([]);

	const [newConversationData, setNewConversationData] = useState<
		Array<Conversation>
	>([]);

	const [currentConversationId, setCurrentConversationId] = useState<
		number | null
	>(null);

	const [selectedConversation, setSelectedConversation] =
		useState<Conversation | null>(null);

	const [newConversationParticipant, setNewConversationParticipant] = useState<{
		id: number;
		name: string;
	} | null>(null);

	return {
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
	};
};

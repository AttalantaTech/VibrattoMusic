import type { Conversation } from "@/api/services/messages/types";
import { useRef } from "react";

export const useMessagesRefs = (conversations: Array<Conversation>) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const conversationsRef = useRef<Array<Conversation>>(conversations);

	return {
		messagesEndRef,
		messagesContainerRef,
		conversationsRef,
	};
};

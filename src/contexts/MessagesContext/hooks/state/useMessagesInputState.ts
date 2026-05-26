import { useState } from "react";
import type { Message } from "@/api/services/messages/types";

export const useMessagesInputState = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [messageInput, setMessageInput] = useState("");
	const [messages, setMessages] = useState<Array<Message>>([]);
	const [newMessages, setNewMessages] = useState<Array<Message>>([]);

	return {
		searchQuery,
		setSearchQuery,
		messages,
		setMessages,
		messageInput,
		setMessageInput,
		newMessages,
		setNewMessages,
	};
};

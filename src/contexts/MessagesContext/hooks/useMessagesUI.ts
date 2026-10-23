import { useMemo } from "react";
import type { UseMessagesUIProps } from "../types";

export const useMessagesUI = ({
	conversations,
	searchQuery,
}: UseMessagesUIProps) => {
	const filteredConversations = useMemo(() => {
		return (
			conversations.filter((conversation) => {
				if (!searchQuery) return true;

				const searchLower = searchQuery.toLowerCase();

				return (
					conversation.produtoMusicalNome.toLowerCase().includes(searchLower) ||
					conversation.ultimaMensagem?.conteudo
						.toLowerCase()
						.includes(searchLower)
				);
			}) || []
		);
	}, [conversations, searchQuery]);

	return {
		filteredConversations,
	};
};

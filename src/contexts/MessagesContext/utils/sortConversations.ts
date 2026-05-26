import type { Conversation } from "@/api/services/messages/types";

export const sortConversations = (conversations: Array<Conversation>) => {
	return conversations.sort((a: Conversation, b: Conversation) => {
		const dateA = a.ultimaMensagem?.dataEnvio
			? new Date(a.ultimaMensagem.dataEnvio).getTime()
			: 0;

		const dateB = b.ultimaMensagem?.dataEnvio
			? new Date(b.ultimaMensagem.dataEnvio).getTime()
			: 0;

		return dateB - dateA;
	});
};

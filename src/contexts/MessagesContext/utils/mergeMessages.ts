import type { Message } from "@/api/services/messages/types";

export const mergeMessages = (
	historyMessages: Array<Message>,
	newMessages: Array<Message>
) => {
	const combinedMessages = [
		...historyMessages,
		...newMessages.filter(
			(nm) => !historyMessages.some((hm) => hm.id === nm.id)
		),
	];

	combinedMessages.sort((a, b) => a.id - b.id);

	return combinedMessages;
};

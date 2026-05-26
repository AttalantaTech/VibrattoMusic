import type { Message } from "@/api/services/messages/types";
import type { InfiniteData } from "@tanstack/react-query";

export const mapMessages = (
	historyMessages: InfiniteData<Array<Message>, unknown>
) => {
	return (
		historyMessages.pages.flatMap((page: Array<Message>) =>
			page.flatMap((message: Message) => message)
		) ?? []
	);
};

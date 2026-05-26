import { useContext } from "react";
import { MessagesContext } from "@/contexts/MessagesContext/context";

export function useChat() {
	const context = useContext(MessagesContext);

	if (!context) {
		throw new Error("useChat must be used within MessagesProvider");
	}

	return {
		...context,
	};
}

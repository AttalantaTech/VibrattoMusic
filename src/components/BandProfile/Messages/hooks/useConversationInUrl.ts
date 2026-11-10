import { useEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

interface Snapshot {
	/** Conversation open on screen */
	selectedId: number | undefined;
	/** Conversation in the address (?conversa=) */
	urlId: number | undefined;
}

export type UrlAction =
	| { type: "open"; id: number; replace: boolean }
	| { type: "close" }
	| { type: "clear" }
	| null;

/**
 * Keeps the open conversation and the address in step:
 * - opening one adds it to the address (a new history entry; switching to
 *   another conversation replaces it, so "back" doesn't walk through them)
 * - "back" takes it out of the address: the conversation closes
 * - closing it on screen (arrow, Esc) leaves it in the address: clear it
 */
export const nextUrlAction = (
	previous: Snapshot,
	current: Snapshot
): UrlAction => {
	const { selectedId, urlId } = current;

	if (selectedId && selectedId !== previous.selectedId) {
		return urlId === selectedId
			? null
			: { type: "open", id: selectedId, replace: urlId !== undefined };
	}
	if (selectedId && previous.urlId !== undefined && urlId === undefined) {
		return { type: "close" };
	}
	if (!selectedId && urlId !== undefined) return { type: "clear" };
	return null;
};

/**
 * Makes the phone's (and the browser's) back button close the open
 * conversation instead of leaving the messages: on phones the chat covers the
 * screen like an app, and "back" used to take the user out of the page
 */
export const useConversationInUrl = (
	selectedId: number | undefined,
	close: () => void
) => {
	const navigate = useNavigate();
	const search: { conversa?: number } = useSearch({ strict: false });
	const urlId = search.conversa;

	const previous = useRef<Snapshot>({
		selectedId: undefined,
		urlId: undefined,
	});
	// Whether the address entry was added here (then "back" removes it) or
	// came with the page, e.g. a reload (then it is just cleaned)
	const addedEntry = useRef(false);

	useEffect(() => {
		const action = nextUrlAction(previous.current, { selectedId, urlId });
		previous.current = { selectedId, urlId };
		if (!action) return;

		if (action.type === "open") {
			if (!action.replace) addedEntry.current = true;
			void navigate({
				to: ".",
				search: (current) => ({ ...current, conversa: action.id }),
				replace: action.replace,
			});
			return;
		}

		if (action.type === "close") {
			addedEntry.current = false;
			close();
			return;
		}

		if (addedEntry.current) {
			addedEntry.current = false;
			window.history.back();
			return;
		}
		void navigate({
			to: ".",
			search: (current) => ({ ...current, conversa: undefined }),
			replace: true,
		});
	}, [selectedId, urlId, navigate, close]);
};

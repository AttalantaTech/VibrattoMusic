import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useChat } from "@/hooks/useChat";
import { useAuthStore } from "@/store/authStore";
import { usePageTitleStore } from "@/store/pageTitleStore";
import {
	countUnreadConversations,
	formatPageTitle,
	pageNameFor,
	withUnreadCount,
} from "@/utils/pageTitle";

/**
 * The browser tab: "(3) Mensagens · Vibratto Music". The page comes from the
 * address (utils/pageTitle) or from the page itself (usePageTitle); the
 * number, from the conversations with unread messages, like the header's
 * message icon. Used once, at the root of the router
 */
export const useRouteTitle = (): void => {
	const location = useRouterState({ select: (state) => state.location });
	const pageName = usePageTitleStore((state) => state.pageName);
	const { isAuthenticated } = useAuthStore();
	const { conversations } = useChat();
	const unread = isAuthenticated ? countUnreadConversations(conversations) : 0;

	useEffect(() => {
		const name =
			pageName ??
			pageNameFor(
				location.pathname,
				location.search as Record<string, unknown>
			);
		document.title = withUnreadCount(formatPageTitle(name), unread);
	}, [location.pathname, location.search, pageName, unread]);
};

/**
 * For a page whose name comes from data, like a band's public profile:
 * "Banda X · Vibratto Music" once loaded. Leaving the page gives the title
 * back to the address
 */
export const usePageTitle = (name?: string | null): void => {
	const setPageName = usePageTitleStore((state) => state.setPageName);

	useEffect(() => {
		setPageName(name?.trim() ? name : null);
		return () => {
			setPageName(null);
		};
	}, [name, setPageName]);
};

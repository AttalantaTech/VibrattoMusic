import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { formatPageTitle, pageNameFor } from "@/utils/pageTitle";

/**
 * The browser tab follows the page (see utils/pageTitle). Used once, at the
 * root of the router
 */
export const useRouteTitle = (): void => {
	const location = useRouterState({ select: (state) => state.location });

	useEffect(() => {
		const name = pageNameFor(
			location.pathname,
			location.search as Record<string, unknown>
		);
		// null: the page sets its own title (usePageTitle)
		if (name !== null) document.title = formatPageTitle(name);
	}, [location.pathname, location.search]);
};

/**
 * For a page whose name comes from data, like a band's public profile:
 * "Banda X · Vibratto Music" once loaded
 */
export const usePageTitle = (name?: string | null): void => {
	useEffect(() => {
		document.title = formatPageTitle(name);
	}, [name]);
};

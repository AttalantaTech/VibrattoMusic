import { useNavigate, useSearch } from "@tanstack/react-router";

/**
 * Custom hook to sync tab state with URL search params
 *
 * @param routePath - The route path (e.g., "/band/me")
 * @param defaultTab - The default tab if none is specified in URL
 * @param parameterName - The search param name (default: "tab")
 * @returns [activeTab, setActiveTab] - Current tab value and setter function
 */
export const useTabWithUrl = (
	routePath: string,
	defaultTab: string,
	parameterName: string = "tab"
): [string, (newTab: string) => void] => {
	const navigate = useNavigate({ from: routePath as any });
	const searchParameters = useSearch({ from: routePath as any });

	// Get active tab from URL or use default
	const activeTab = String(searchParameters[parameterName] || defaultTab);

	// Function to update tab in URL
	const setActiveTab = (newTab: string) => {
		void navigate({
			search: (previous: any) => ({ ...previous, [parameterName]: newTab }),
			replace: true,
		} as any);
	};

	return [activeTab, setActiveTab];
};

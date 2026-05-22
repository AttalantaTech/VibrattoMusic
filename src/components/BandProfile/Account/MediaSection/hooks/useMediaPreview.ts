import { useState } from "react";

export function useMediaPreview() {
	const [loadedItems, setLoadedItems] = useState<Record<string, boolean>>({});

	const markAsLoaded = (url: string) => {
		setLoadedItems((previous) => ({
			...previous,
			[url]: true,
		}));
	};

	const isLoaded = (url: string) => {
		return loadedItems[url];
	};

	return {
		markAsLoaded,
		isLoaded,
		loadedItems,
	};
}

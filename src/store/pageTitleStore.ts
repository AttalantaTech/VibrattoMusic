import { create } from "zustand";

/**
 * The name a page gives itself from its data (a band's public profile), in
 * place of the one from the address. null: use the address
 */
interface PageTitleState {
	pageName: string | null;
	setPageName: (name: string | null) => void;
}

export const usePageTitleStore = create<PageTitleState>((set) => ({
	pageName: null,
	setPageName: (pageName) => {
		set({ pageName });
	},
}));

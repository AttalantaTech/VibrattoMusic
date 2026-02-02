import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MusicalProduct } from "@/api/types";

interface MusicalProductState {
	activeProduct: MusicalProduct | null;
	availableProducts: Array<MusicalProduct>;
	isLoadingMusicalProduct: boolean;

	setAvailableProducts: (products: Array<MusicalProduct>) => void;
	setActiveProduct: (product: MusicalProduct) => void;
	setIsLoadingMusicalProduct: (state: boolean) => void;
	clear: () => void;

	hasMultipleProducts: () => boolean;
	getActiveProductData: () => MusicalProduct | null;
}

export const useMusicalProductStore = create<MusicalProductState>()(
	persist(
		(set, get) => ({
			isLoadingMusicalProduct: false,
			activeProduct: null,
			availableProducts: [],

			setAvailableProducts: (products) => {
				const current = get().activeProduct;

				let nextActive: MusicalProduct | null = null;

				if (current) {
					nextActive =
						products.find((p) => p.id === current.id) ?? products[0] ?? null;
				} else {
					nextActive = products[0] ?? null;
				}

				set({
					availableProducts: products,
					activeProduct: nextActive,
				});
			},

			setActiveProduct: (product) => {
				set({ activeProduct: product });
			},

			setIsLoadingMusicalProduct: (state) => {
				set({ isLoadingMusicalProduct: state });
			},

			clear: () => {
				set({
					activeProduct: null,
					availableProducts: [],
				});
			},

			hasMultipleProducts: () => {
				return get().availableProducts.length > 1;
			},

			getActiveProductData: () => {
				const { activeProduct, availableProducts } = get();
				if (!activeProduct) return null;

				return availableProducts.find((p) => p.id === activeProduct.id) ?? null;
			},
		}),
		{
			name: "vibratto_active_musical_product",
			partialize: (state) => ({
				activeProduct: state.activeProduct,
			}),
		}
	)
);

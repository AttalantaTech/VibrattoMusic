import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MusicalProduct } from "@/api/types";

interface MusicalProductState {
	activeProduct: MusicalProduct | null;
	availableProducts: Array<MusicalProduct>;
	isLoadingMusicalProduct: boolean;
	newProductCreated: number | null;

	setAvailableProducts: (products: Array<MusicalProduct>) => void;
	setActiveProduct: (product: MusicalProduct | null) => void;
	setIsLoadingMusicalProduct: (state: boolean) => void;
	setNewProductCreated: (productId: number | null) => void;
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
			newProductCreated: null,

			setAvailableProducts: (products) => {
				set({
					availableProducts: products,
				});
			},

			setActiveProduct: (product) => {
				set({ activeProduct: product });
			},

			setIsLoadingMusicalProduct: (state) => {
				set({ isLoadingMusicalProduct: state });
			},

			setNewProductCreated: (state) => {
				set({ newProductCreated: state });
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

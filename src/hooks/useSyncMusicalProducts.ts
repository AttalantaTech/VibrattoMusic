import { useEffect } from "react";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import type { MusicalProductListApiResponse, User } from "@/api/types";

interface SyncMusicalProducts {
	musicalProducts: MusicalProductListApiResponse | null;
	user: User | null;
	isLoading: boolean;
	setHasMoreProfiles: (value: boolean) => void;
	profilePage: number;
	profilePageSize: number;
}

export const useSyncMusicalProducts = ({
	musicalProducts,
	user,
	isLoading,
	setHasMoreProfiles,
	profilePageSize,
	profilePage,
}: SyncMusicalProducts) => {
	const {
		setAvailableProducts,
		setIsLoadingMusicalProduct,
		setActiveProduct,
		activeProduct,
		newProductCreated,
		setNewProductCreated,
		availableProducts,
	} = useMusicalProductStore();

	const clear = useMusicalProductStore((s) => s.clear);

	useEffect(() => {
		if (!user?.id) {
			// clear() creates a new empty array; calling it when the store is
			// already empty changes `availableProducts` and re-runs this effect forever
			if (availableProducts.length > 0 || activeProduct) clear();
			return;
		}

		if (!musicalProducts?.dados) return;

		setIsLoadingMusicalProduct(isLoading);

		if (musicalProducts.dados.length < profilePageSize) {
			setHasMoreProfiles?.(false);
		}

		if (profilePage === 1) {
			setAvailableProducts(musicalProducts.dados);
		} else {
			const existingIds = new Set(availableProducts.map((city) => city.id));

			const uniqueProducts = musicalProducts.dados.filter(
				(product) => !existingIds.has(product.id)
			);

			if (uniqueProducts.length > 0) {
				setAvailableProducts([...availableProducts, ...uniqueProducts]);
			}
		}

		if (newProductCreated) {
			const product = musicalProducts.dados.find(
				(item) => item.id === newProductCreated
			);

			if (product) {
				setActiveProduct(product);
			}

			setNewProductCreated(null);
			return;
		}

		if (activeProduct) {
			const product = musicalProducts.dados.find(
				(item) => item.id === activeProduct.id
			);

			if (product) setActiveProduct(product);
		}
	}, [
		musicalProducts,
		user?.id,
		isLoading,
		profilePage,
		profilePageSize,
		availableProducts,
		activeProduct,
		newProductCreated,
		setAvailableProducts,
		setIsLoadingMusicalProduct,
		setActiveProduct,
		setNewProductCreated,
		setHasMoreProfiles,
		clear,
	]);
};

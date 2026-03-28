import { useEffect } from "react";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

export const useSyncMusicalProducts = () => {
	const { musicalProducts, user, isLoading } = useProfileStatus();
	const {
		setAvailableProducts,
		setIsLoadingMusicalProduct,
		setActiveProduct,
		activeProduct,
		newProductCreated,
		setNewProductCreated,
	} = useMusicalProductStore();
	const clear = useMusicalProductStore((s) => s.clear);

	useEffect(() => {
		if (!user?.id) {
			clear();
			return;
		}

		setIsLoadingMusicalProduct(isLoading);

		if (musicalProducts && musicalProducts.dados.length > 0) {
			setAvailableProducts(musicalProducts.dados);

			if (newProductCreated) {
				const product = musicalProducts.dados.find(
					(item) => item.id === newProductCreated
				);

				if (product) setActiveProduct(product);

				setNewProductCreated(null);
			} else if (activeProduct) {
				const product = musicalProducts.dados.find(
					(item) => item.id === activeProduct.id
				);

				if (product) setActiveProduct(product);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		musicalProducts,
		user?.id,
		setAvailableProducts,
		clear,
		setIsLoadingMusicalProduct,
		isLoading,
		activeProduct,
		setActiveProduct,
	]);
};

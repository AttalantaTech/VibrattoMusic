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

			if (activeProduct) {
				const product = musicalProducts.dados.find(
					(item) => item.id === activeProduct.id
				);

				if (product) setActiveProduct(product);
			}
		}
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

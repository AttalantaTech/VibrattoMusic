import { useEffect } from "react";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

export const useSyncMusicalProducts = () => {
	const { musicalProducts, user, isLoading } = useProfileStatus();
	const { setAvailableProducts, setIsLoadingMusicalProduct } =
		useMusicalProductStore();
	const clear = useMusicalProductStore((s) => s.clear);

	useEffect(() => {
		if (!user?.id) {
			clear();
			return;
		}

		setIsLoadingMusicalProduct(isLoading);

		if (musicalProducts && musicalProducts.length > 0) {
			setAvailableProducts(musicalProducts);
		}
	}, [
		musicalProducts,
		user?.id,
		setAvailableProducts,
		clear,
		setIsLoadingMusicalProduct,
		isLoading,
	]);
};

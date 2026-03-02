import { useState, useEffect, useCallback, useMemo } from "react";
import { useProfileStatus } from "./useProfileStatus";
import type { MusicalProductApiResponse } from "../api/types";

export type ActiveMusicalProduct = MusicalProductApiResponse;

const STORAGE_KEY = "vibratto_active_musical_product";

/** helpers */
const isLocalStorageAvailable = (): boolean => {
	try {
		const test = "__ls_test__";
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	} catch {
		return false;
	}
};

const isValidProduct = (value: unknown): value is ActiveMusicalProduct => {
	if (!value || typeof value !== "object") return false;
	const product = value as Record<string, unknown>;

	return (
		(typeof product["id"] === "string" || typeof product["id"] === "number") &&
		typeof product["nome"] === "string"
	);
};

const readStoredProduct = (): ActiveMusicalProduct | null => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw);
		return isValidProduct(parsed) ? parsed : null;
	} catch {
		return null;
	}
};

/** hook */
export const useActiveMusicalProduct = () => {
	const { musicalProducts, user } = useProfileStatus();
	const storageAvailable = useMemo(isLocalStorageAvailable, []);

	const [activeProduct, setActiveProduct] =
		useState<ActiveMusicalProduct | null>(null);

	/**
	 * Single source of truth:
	 * musicalProducts loaded → decide activeProduct
	 */
	useEffect(() => {
		if (!musicalProducts || musicalProducts.dados.length === 0) return;

		const stored = storageAvailable ? readStoredProduct() : null;

		const validStored =
			stored && musicalProducts.dados.find((p) => p.id === stored.id);

		const productToUse = validStored || musicalProducts.dados[0];

		setActiveProduct(productToUse ?? null);

		if (storageAvailable) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(productToUse));
		}
	}, [musicalProducts, storageAvailable]);

	/** logout */
	useEffect(() => {
		if (!user?.id) {
			setActiveProduct(null);
			if (storageAvailable) {
				localStorage.removeItem(STORAGE_KEY);
			}
		}
	}, [user?.id, storageAvailable]);

	/** actions */
	const changeActiveProduct = useCallback(
		(product: ActiveMusicalProduct) => {
			if (!isValidProduct(product)) return;

			setActiveProduct(product);

			if (storageAvailable) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(product));
			}
		},
		[storageAvailable]
	);

	const clearStoredProduct = useCallback(() => {
		setActiveProduct(null);
		if (storageAvailable) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}, [storageAvailable]);

	const getActiveProductData = useCallback(() => {
		if (!activeProduct || !musicalProducts) return null;
		return musicalProducts.dados.find((p) => p.id === activeProduct.id) || null;
	}, [activeProduct, musicalProducts]);

	/** derived */
	return {
		activeProduct,
		availableProducts: musicalProducts ?? [],
		changeActiveProduct,
		clearStoredProduct,
		getActiveProductData,
		hasMultipleProducts: (musicalProducts?.dados.length || 0) > 1,
		isLoading: !musicalProducts && !!user?.id,
	};
};

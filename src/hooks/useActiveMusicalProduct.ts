import { useState, useEffect, useCallback } from 'react';
import { useProfileStatus } from './useProfileStatus';
import type { MusicalProductApiResponse } from '../api/types';

export interface ActiveMusicalProduct {
  id: string;
  name: string;
  avatarUrl?: string;
}

const ACTIVE_PRODUCT_STORAGE_KEY = 'vibratto_active_musical_product';

/**
 * Check if localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Hook to manage the active musical product state
 * Handles persistence and synchronization across the app
 */
export const useActiveMusicalProduct = () => {
  const { musicalProducts, user } = useProfileStatus();
  const [activeProduct, setActiveProduct] = useState<ActiveMusicalProduct | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Memoize localStorage availability to avoid calling it on every render
  const localStorageAvailable = useCallback(() => isLocalStorageAvailable(), []);

  // Load active product from localStorage on mount (only once)
  useEffect(() => {
    if (hasInitialized) return; // Only run once

    if (localStorageAvailable()) {
      try {
        const stored = localStorage.getItem(ACTIVE_PRODUCT_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as ActiveMusicalProduct;
          if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
            setActiveProduct(parsed);
          } else {
            console.warn('Invalid stored product data, removing from localStorage');
            localStorage.removeItem(ACTIVE_PRODUCT_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.warn('Failed to parse stored active product:', error);
        localStorage.removeItem(ACTIVE_PRODUCT_STORAGE_KEY);
      }
    }

    setHasInitialized(true);
  }, [localStorageAvailable, hasInitialized]);

  // Sync with musicalProducts when they load (only if we don't have an active product yet)
  useEffect(() => {
    if (!hasInitialized || !musicalProducts || musicalProducts.length === 0) return;

    // If we already have an active product, validate it exists in current musical products
    if (activeProduct) {
      const existingProduct = musicalProducts.find(p => p.id.toString() === activeProduct.id);
      if (!existingProduct) {
        console.warn('Current active product no longer exists, selecting first available');
        const firstProduct = musicalProducts[0];
        if (firstProduct) {
          const newActiveProduct = {
            id: firstProduct.id.toString(),
            name: firstProduct.nome,
            avatarUrl: firstProduct.fotoPerfil || undefined,
          };
          setActiveProduct(newActiveProduct);
          if (localStorageAvailable()) {
            localStorage.setItem(ACTIVE_PRODUCT_STORAGE_KEY, JSON.stringify(newActiveProduct));
          }
        }
      }
      return;
    }

    // No active product set, use first musical product as default
    const firstProduct = musicalProducts[0];
    if (firstProduct) {
      const defaultProduct = {
        id: firstProduct.id.toString(),
        name: firstProduct.nome,
        avatarUrl: firstProduct.fotoPerfil || undefined,
      };

      setActiveProduct(defaultProduct);

      if (localStorageAvailable()) {
        localStorage.setItem(ACTIVE_PRODUCT_STORAGE_KEY, JSON.stringify(defaultProduct));
      }
    }
  }, [musicalProducts, activeProduct, localStorageAvailable, hasInitialized]);

  // Clear on logout
  useEffect(() => {
    if (hasInitialized && (user?.id === undefined || user?.id === null)) {
      setActiveProduct(null);
      if (localStorageAvailable()) {
        localStorage.removeItem(ACTIVE_PRODUCT_STORAGE_KEY);
      }
    }
  }, [user?.id, localStorageAvailable, hasInitialized]);

  // Function to change active product
  const changeActiveProduct = useCallback((product: ActiveMusicalProduct) => {
    // Validate input before saving
    if (!product || !product.id || !product.name) {
      console.warn('Invalid product data provided to changeActiveProduct');
      return;
    }

    try {
      setActiveProduct(product);
      if (localStorageAvailable()) {
        localStorage.setItem(ACTIVE_PRODUCT_STORAGE_KEY, JSON.stringify(product));
      }
    } catch (error) {
      console.error('Failed to save active product to localStorage:', error);
      // Still update state even if localStorage fails
      setActiveProduct(product);
    }
  }, [localStorageAvailable]);

  // Function to get current active product data
  const getActiveProductData = useCallback((): MusicalProductApiResponse | null => {
    if (!activeProduct || !musicalProducts) return null;

    return musicalProducts.find(p => p.id.toString() === activeProduct.id) || null;
  }, [activeProduct, musicalProducts]);

  // Get available products for the switcher
  const availableProducts: ActiveMusicalProduct[] = musicalProducts?.map(product => ({
    id: product.id.toString(),
    name: product.nome,
    avatarUrl: product.fotoPerfil || undefined,
  })) || [];


  // Function to clear stored active product (useful for logout)
  const clearStoredProduct = useCallback(() => {
    try {
      if (localStorageAvailable()) {
        localStorage.removeItem(ACTIVE_PRODUCT_STORAGE_KEY);
      }
      setActiveProduct(null);
    } catch (error) {
      console.error('Failed to clear stored active product:', error);
    }
  }, [localStorageAvailable]);

  // Function to get stored product directly from localStorage (without state)
  const getStoredProduct = useCallback((): ActiveMusicalProduct | null => {
    if (!localStorageAvailable()) {
      return null;
    }

    try {
      const stored = localStorage.getItem(ACTIVE_PRODUCT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ActiveMusicalProduct;
        if (parsed && typeof parsed.id === 'string' && typeof parsed.name === 'string') {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to get stored product:', error);
    }
    return null;
  }, [localStorageAvailable]);

  return {
    activeProduct,
    availableProducts,
    changeActiveProduct,
    getActiveProductData,
    clearStoredProduct,
    getStoredProduct,
    hasMultipleProducts: (musicalProducts?.length || 0) > 1,
    isLoading: !musicalProducts && user?.id,
  };
};

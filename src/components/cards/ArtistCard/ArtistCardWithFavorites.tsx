import type React from "react";
import { useState } from "react";
import { ArtistCard } from "./ArtistCard";
import { useToggleFavorite, useFavorites } from "../../../hooks/useUser";
import { useAuthStore } from "../../../store/authStore";
import type { MusicalProductApiResponse } from "../../../api/types";

interface ArtistCardWithFavoritesProps {
	product: MusicalProductApiResponse;
	onProfileClick?: () => void;
	listOnMobile?: boolean;
}

export const ArtistCardWithFavorites: React.FC<
	ArtistCardWithFavoritesProps
> = ({ product, onProfileClick, listOnMobile }) => {
	const { isAuthenticated } = useAuthStore();
	const { data: favorites } = useFavorites();
	const toggleFavoriteMutation = useToggleFavorite();
	const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

	// Determine current favorite state - use optimistic state if available, otherwise server state
	const isServerFavorite =
		favorites?.data?.some((f) => f.id === product.id) ?? false;
	const isFavorite =
		optimisticState !== null ? optimisticState : isServerFavorite;

	const handleFavoriteClick = async () => {
		if (!isAuthenticated) return;

		try {
			// Set optimistic state immediately
			const newState = !isFavorite;
			setOptimisticState(newState);

			// Call API
			await toggleFavoriteMutation.mutateAsync({
				produtoMusicalId: product.id,
			});

			// API success - keep optimistic state indefinitely
			// Don't clear it to prevent flickering when cache updates
		} catch (error) {
			console.error("Failed to toggle favorite:", error);
			// Revert optimistic state on error
			setOptimisticState(null);
		}
	};

	return (
		<ArtistCard
			name={product.nome}
			description={product.descricao}
			genres={product.generoMusical?.map((g) => g.nome) ?? []}
			location={product.cidade?.nome ?? ""}
			rating={product.avaliacao ?? undefined}
			verified={false}
			imgSrc={product.fotoPerfil ?? undefined}
			onFavoriteClick={isAuthenticated ? handleFavoriteClick : undefined}
			isFavorite={isFavorite}
			isFavoriteLoading={toggleFavoriteMutation.isPending}
			onProfileClick={onProfileClick}
			listOnMobile={listOnMobile}
		/>
	);
};

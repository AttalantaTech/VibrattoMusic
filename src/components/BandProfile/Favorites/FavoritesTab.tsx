import { Heart, Loader2 } from "lucide-react";
import { ArtistCardWithFavorites } from "../../cards/ArtistCard/ArtistCardWithFavorites";
import { useFavorites } from "../../../hooks/useUser";
import { useAuthStore } from "../../../store/authStore";
import { useNavigate } from "@tanstack/react-router";

export const FavoritesTab = () => {
	const navigate = useNavigate();
	const { isAuthenticated } = useAuthStore();
	const { data: favorites, isLoading, error } = useFavorites(isAuthenticated);

	const handleProfileClick = (bandId: number) => {
		void navigate({ to: "/band/profile/$id", params: { id: String(bandId) } });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
					<p className="text-gray-600">Carregando seus favoritos...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<p className="text-red-600 mb-2">Erro ao carregar favoritos</p>
					<p className="text-gray-600 text-sm">
						Por favor, tente novamente mais tarde.
					</p>
				</div>
			</div>
		);
	}

	const favoritesList = favorites?.data || [];

	if (favoritesList.length === 0) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center max-w-md">
					<div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<Heart className="w-10 h-10 text-gray-400" />
					</div>
					<h3 className="text-xl font-semibold text-gray-900 mb-2">
						Nenhum favorito ainda
					</h3>
					<p className="text-gray-600 mb-6">
						Explore a plataforma e adicione suas bandas favoritas para
						acompanhá-las mais facilmente.
					</p>
					<button
						onClick={() => void navigate({ to: "/search" })}
						className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
					>
						Descobrir Bandas
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-full h-full gap-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
						<Heart className="w-5 h-5 text-red-600 fill-current" />
					</div>
					<div>
						<h2 className="text-xl font-semibold text-gray-900">
							Meus Favoritos
						</h2>
						<p className="text-sm text-gray-600">
							{favoritesList.length}{" "}
							{favoritesList.length === 1 ? "banda" : "bandas"} favoritas
						</p>
					</div>
				</div>
			</div>

			{/* Favorites Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{favoritesList.map((favorite) => (
					<ArtistCardWithFavorites
						key={favorite.id}
						product={favorite}
						onProfileClick={() => {
							handleProfileClick(favorite.id);
						}}
					/>
				))}
			</div>
		</div>
	);
};

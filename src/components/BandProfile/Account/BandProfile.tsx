import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
	Clock4,
	Heart,
	MessageCircle,
	Star,
	TrendingUp,
	BookCheck,
} from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button/Button";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LazyImage } from "@/components/ui/LazyImage/LazyImage";
import { ArtistCard } from "@/components/cards/ArtistCard/ArtistCard";

import { useAuthStore } from "@/store/authStore";
import { useToggleFavorite, useFavorites } from "@/hooks/useUser";
import { extractYouTubeId, extractSpotifyResource } from "@/lib/utils/cn";
import type {
	MusicalProduct,
	MusicalProductListApiResponse,
} from "@/api/types";
import { StartConversationModal } from "@/components/BandProfile/Messages/components/StartConversationModal";
import { useStartConversation } from "@/hooks/useMessaging";
import { toast } from "sonner";
import { RatingBars } from "@/components/RatingBars/RatingBars";
import { RatingComment } from "@/components/RatingComment/RatingComment";
import { CheckAvailabilityModal } from "@/components/BandProfile/Proposals/components/CheckAvailabilityModal";
import { ProfileDetails } from "./ProfileDetails";
import { MediaPlayer } from "@/components/MediaPlayer/MediaPlayer";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

const styles = {
	genre: "font-medium text-[#085EC5] bg-[#D6F2FF] py-[2x] px-2 rounded-2xl",
	subtitle: "text-gray-500 text-xs flex w-full items-start justify-start",
	artistInfoBox:
		"flex flex-col w-full h-full items-center justify-center gap-[6px]",
	section: "flex flex-col w-full gap-[6px] items-start justify-start",
};

interface BandProfileProps {
	musicalProduct: MusicalProduct | null;
	similarArtists: MusicalProductListApiResponse | undefined;
	similarArtistsLoading: boolean;
	bandLoading: boolean;
}

export const BandProfile = ({
	musicalProduct,
	similarArtists,
	similarArtistsLoading,
	bandLoading,
}: BandProfileProps) => {
	const navigate = useNavigate();
	const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);
	const [isCheckAvailabilityOpen, setIsCheckAvailabilityOpen] = useState(false);
	const [loadingYoutube, setLoadingYoutube] = useState(true);
	const [loadingSpotify, setLoadingSpotify] = useState(true);

	// Auth and favorites
	const { isAuthenticated } = useAuthStore();
	const { data: favorites } = useFavorites(isAuthenticated);
	const toggleFavoriteMutation = useToggleFavorite();

	const { activeProduct } = useMusicalProductStore();

	const urlParameters = new URLSearchParams(window.location.search);
	const customRedirect = urlParameters.get("action");

	// Start conversation hook
	const startConversationMutation = useStartConversation();

	// Handler for favorite toggle
	const handleFavoriteToggle = (productId: number) => {
		if (isAuthenticated) {
			toggleFavoriteMutation.mutate({ produtoMusicalId: productId });
		}
	};

	const handleRequestCheckAvailability = () => {
		const redirectTo = window.location.pathname + "?action=check-availability";

		if (!isAuthenticated) {
			toast.error("Você precisa estar logado para verificar disponibilidade");
			void navigate({
				to: `/login?redirect=${encodeURIComponent(redirectTo)}`,
			});
			return;
		}

		setIsCheckAvailabilityOpen(true);
	};

	// Handler for request quote button
	const handleRequestQuote = () => {
		const redirectTo = window.location.pathname + "?action=conversation";

		if (!isAuthenticated) {
			toast.error("Você precisa estar logado para usar o chat");
			void navigate({
				to: `/login?redirect=${encodeURIComponent(redirectTo)}`,
			});
			return;
		}
		setIsConversationModalOpen(true);
	};

	useEffect(() => {
		if (customRedirect === "conversation") {
			setIsConversationModalOpen(true);
		} else if (customRedirect === "check-availability") {
			setIsCheckAvailabilityOpen(true);
		}
	}, [customRedirect]);

	const renderYoutubeContent = (): ReactNode => {
		const video =
			musicalProduct?.videosYouTube.find((item) => item)?.link ?? "";
		const videoId = extractYouTubeId(video);

		return videoId ? (
			<div className="relative w-full rounded-lg overflow-hidden">
				{loadingYoutube && (
					<div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
				)}
				<MediaPlayer
					className="aspect-video"
					src={`https://www.youtube.com/embed/${videoId}`}
					onLoad={() => {
						setLoadingYoutube(false);
					}}
				/>
			</div>
		) : (
			<a
				href={video}
				target="_blank"
				rel="noopener noreferrer"
				className="block"
			>
				<LazyImage
					alt="Video"
					className="rounded-lg h-40 sm:h-48 lg:h-[180px] w-full object-cover hover:opacity-90 transition-opacity"
					src={musicalProduct?.fotoPerfil || ""}
				/>
			</a>
		);
	};

	const renderSpotifyContent = (): ReactNode => {
		const spotifyResource = extractSpotifyResource(
			musicalProduct?.spotifyPlaylistId || ""
		);

		return (
			<div className="relative aspect-video h-full w-full rounded-lg">
				{loadingSpotify && (
					<div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
				)}
				<iframe
					src={`https://open.spotify.com/embed/${spotifyResource?.type}/${spotifyResource?.id}`}
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					width="100%"
					height="152"
					allowFullScreen
					onLoad={() => {
						setLoadingSpotify(false);
					}}
				/>
			</div>
		);
	};

	// Loading state
	if (bandLoading) {
		return (
			<MainLayout>
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Carregando perfil da banda...</p>
					</div>
				</div>
			</MainLayout>
		);
	}

	// Error state
	if (!musicalProduct?.id) {
		return (
			<MainLayout>
				<div className="flex items-center justify-center min-h-40">
					<div className="flex flex-col text-center">
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Dados não encontrados
						</h2>
						<p className="text-gray-600 mb-4">
							Dados de Produto Musical não encontrados.
						</p>
						<Button onClick={() => navigate({ to: "/" })}>
							Voltar para a página inicial
						</Button>
					</div>
				</div>
			</MainLayout>
		);
	}

	// Check if musicalProduct is in favorites
	const isFavorite =
		favorites?.data?.some((f) => f.id === musicalProduct.id) ?? false;

	return (
		<>
			<main className="flex flex-col w-full min-h-screen items-start justify-start">
				<div className="flex flex-col lg:flex-row w-full items-start gap-4 lg:gap-8 justify-start lg:justify-center max-w-7xl mx-auto">
					{/* Main Content */}
					<div className="flex flex-col w-full lg:flex-1 h-full items-center justify-start gap-4 lg:gap-8 order-2 lg:order-1">
						<ProfileDetails musicalProduct={musicalProduct} />

						{/* Customer Reviews */}
						<section className={styles.section}>
							<div className="flex flex-col items-center lg:items-start gap-6 w-full">
								<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
									Avaliações dos Clientes
								</h2>
								<div className="flex flex-col lg:flex-row w-full items-center lg:items-start gap-8 bg-gray-50 rounded-xl p-6">
									<div className="flex flex-col gap-3 items-center lg:items-start">
										<div className="text-center lg:text-left">
											<h1 className="text-primary-600 font-bold text-4xl">
												{!musicalProduct ? (
													<div className="bg-gray-200 animate-pulse h-10 w-16 rounded"></div>
												) : (
													musicalProduct?.avaliacao?.toFixed(1) || "4.5"
												)}
											</h1>
											<p className="text-gray-600 text-sm">de 5 estrelas</p>
										</div>
										<div className="text-center lg:text-left">
											<span className="text-gray-700 font-medium text-sm">
												Baseado em{" "}
											</span>
											<span className="text-gray-900 font-semibold text-sm">
												{!musicalProduct ? (
													<div className="bg-gray-200 animate-pulse h-4 w-24 rounded inline-block"></div>
												) : (
													<>
														{musicalProduct?.avaliacao ? "Várias" : "845"}{" "}
														avaliações
													</>
												)}
											</span>
										</div>
										<div className="flex items-center justify-center lg:justify-start gap-1">
											{Array.from({ length: 5 }).map((_, index) => (
												<Star
													key={`star-${index}`}
													fill={index === 4 ? "#D0D5DD" : "currentColor"}
													size={20}
													className={
														index === 4 ? "text-gray-300" : "text-yellow-400"
													}
												/>
											))}
										</div>
									</div>
									<div className="w-full lg:w-3/4">
										<RatingBars
											totalRatings={122}
											ratingDistribution={{
												fiveStars: 60,
												fourStars: 30,
												threeStars: 30,
												twoStars: 2,
												oneStar: 0,
											}}
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 w-full gap-6">
									{Array.from({ length: 4 }).map((_, index) => (
										<div key={`review-${index}`} className="w-full">
											<RatingComment
												comment={{
													author: "Marcos",
													date: "23/06/2024",
													numStars: 5,
													comment:
														"A banda se mostrou muito flexível e acessível, ajustando o repertório para atender ao nosso público. No dia do evento, chegaram no horário combinado, montaram tudo rapidamente e o show foi um sucesso total",
												}}
											/>
										</div>
									))}
								</div>

								<div className="flex w-full items-center justify-center">
									<Button
										className="text-gray-700 text-base font-semibold border border-gray-300 rounded-lg"
										variant="transparent"
									>
										Exibir todas as avaliações
									</Button>
								</div>
							</div>

							<hr className="w-full text-gray-200 mt-8" />
						</section>

						{/* Similar Artists */}
						<section className={styles.section}>
							<div className="flex flex-col items-center lg:items-start gap-6 w-full">
								<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
									Você também pode gostar
								</h2>
								<div className="grid grid-cols-1 lg:grid-cols-3 w-full gap-6">
									{similarArtistsLoading ? (
										// Loading skeletons
										Array.from({ length: 2 }).map((_, index) => (
											<div
												key={`skeleton-${index}`}
												className="w-full flex items-center justify-center"
											>
												<div className="animate-pulse w-full">
													<div className="bg-gray-300 h-48 rounded-lg mb-4 w-full"></div>
													<div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
													<div className="bg-gray-300 h-4 rounded w-1/2"></div>
												</div>
											</div>
										))
									) : (similarArtists?.dados?.length ?? 0) > 0 ? (
										// Real API data
										(similarArtists?.dados ?? [])
											.filter((product) => product.id !== musicalProduct.id) // Exclude current musicalProduct
											.slice(0, 2)
											.map((product) => (
												<div
													key={product.id}
													className="w-full"
													// className="w-full flex items-center justify-center"
												>
													<ArtistCard
														description={product.descricao || ""}
														genres={
															product.generoMusical?.map((g) => g.nome) ?? []
														}
														imgSrc={product.fotoPerfil || ""}
														location={product.cidade?.nome ?? ""}
														name={product.nome}
														onFavoriteClick={
															isAuthenticated
																? () => {
																		handleFavoriteToggle(product.id);
																	}
																: undefined
														}
														isFavorite={
															favorites?.data?.some(
																(f) => f.id === product.id
															) ?? false
														}
														isFavoriteLoading={toggleFavoriteMutation.isPending}
														onProfileClick={() =>
															navigate({
																to: "/band/profile/$id",
																params: { id: product.id.toString() },
															})
														}
													/>
												</div>
											))
									) : (
										// No similar artists message
										<div className="col-span-2 text-center text-gray-500">
											Nenhuma banda similar encontrada
										</div>
									)}
								</div>
							</div>
						</section>
					</div>

					{/* Side Card */}
					{musicalProduct?.id !== activeProduct?.id ? (
						<div className="w-full lg:w-80 xl:w-96 border border-gray-200 rounded-lg flex flex-col gap-4 lg:gap-6 pb-4 px-4 lg:pb-4 lg:px-4 shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08)] order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
							{/* Media content (YouTube or Spotify) */}
							{musicalProduct.videosYouTube.length > 0 &&
							musicalProduct.spotifyPlaylistId ? (
								<div className="flex flex-col gap-2">
									<div className="flex flex-col gap-2">
										{renderYoutubeContent()}
										{renderSpotifyContent()}
									</div>
								</div>
							) : musicalProduct.videosYouTube.length > 0 ? (
								<div className="pt-4">{renderYoutubeContent()}</div>
							) : musicalProduct.spotifyPlaylistId ? (
								<div className="pt-4">{renderSpotifyContent()}</div>
							) : (
								<div className="pt-4">
									<LazyImage
										alt="Band photo"
										className="rounded-lg h-40 sm:h-48 lg:h-[180px] w-full object-cover"
										src={musicalProduct.fotoPerfil}
									/>
								</div>
							)}

							{/* Action buttons */}
							<div className="flex flex-col gap-2">
								<IconButton
									icon={<BookCheck size={20} />}
									onClick={handleRequestCheckAvailability}
									disabled={startConversationMutation.isPending}
								>
									{startConversationMutation.isPending
										? "Carregando..."
										: "Verificar Disponibilidade"}
								</IconButton>
								<IconButton
									variant="none"
									className="bg-green-700 text-white border border-green-300 hover:bg-green-700/90"
									icon={<MessageCircle size={20} />}
									onClick={handleRequestQuote}
									disabled={startConversationMutation.isPending}
								>
									{startConversationMutation.isPending
										? "Carregando..."
										: "Chat"}
								</IconButton>
								<IconButton
									icon={<Heart size={20} />}
									variant="outline"
									onClick={() => {
										handleFavoriteToggle(musicalProduct.id);
									}}
									className={
										isFavorite ? "bg-red-50 text-red-600 border-red-200" : ""
									}
									disabled={toggleFavoriteMutation.isPending}
								>
									{toggleFavoriteMutation.isPending
										? "Carregando..."
										: isFavorite
											? "Favoritado"
											: "Salvar"}
								</IconButton>
							</div>

							{/* Info cards */}
							<div className="flex flex-col w-full text-gray-600 gap-4">
								<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
									<Clock4
										size={20}
										className="flex-shrink-0 text-primary-600"
									/>
									<span className="text-sm font-medium">
										Normalmente responde em 2 horas
									</span>
								</div>
								<div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
									<TrendingUp
										className="flex-shrink-0 mt-0.5 text-green-600"
										size={20}
									/>
									<div className="flex flex-col">
										<span className="text-sm font-semibold text-green-700">
											Popular
										</span>
										<span className="text-xs text-green-600 mt-1">
											Banda em destaque na plataforma
										</span>
									</div>
								</div>
							</div>

							{/* Price range (if available) */}
							{musicalProduct.valorServico ? (
								<div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
									<div className="text-center">
										<span className="text-sm text-primary-700 font-medium">
											A partir de
										</span>
										<div className="text-2xl font-bold text-primary-900">
											R$ {musicalProduct.valorServico.toLocaleString("pt-BR")}
										</div>
									</div>
								</div>
							) : null}
						</div>
					) : (
						<div className="w-full lg:w-80 xl:w-96 border border-gray-200 rounded-lg flex flex-col gap-4 lg:gap-6 pb-4 px-4 lg:pb-4 lg:px-4 shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08)] order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
							{/* Media content (YouTube or Spotify) */}
							{musicalProduct.videosYouTube.length > 0 &&
							musicalProduct.spotifyPlaylistId ? (
								<div className="flex flex-col gap-2">
									<div className="flex flex-col gap-2">
										{renderYoutubeContent()}
										{renderSpotifyContent()}
									</div>
								</div>
							) : musicalProduct.videosYouTube.length > 0 ? (
								<div className="pt-4">{renderYoutubeContent()}</div>
							) : musicalProduct.spotifyPlaylistId ? (
								<div className="pt-4">{renderSpotifyContent()}</div>
							) : (
								<div className="pt-4">
									<LazyImage
										alt="Band photo"
										className="rounded-lg h-40 sm:h-48 lg:h-[180px] w-full object-cover"
										src={musicalProduct.fotoPerfil}
									/>
								</div>
							)}
						</div>
					)}
				</div>
			</main>

			<CheckAvailabilityModal
				isOpen={isCheckAvailabilityOpen}
				onClose={setIsCheckAvailabilityOpen}
				musicalProduct={musicalProduct}
			/>

			{/* Start Conversation Modal */}
			<StartConversationModal
				isOpen={isConversationModalOpen}
				onClose={() => {
					setIsConversationModalOpen(false);
				}}
				participantId={musicalProduct.id}
				participantName={musicalProduct.nome}
				onConversationStarted={() => {
					setIsConversationModalOpen(false);
					toast.success("Conversa iniciada com sucesso!");
					// Navigate to band me messages tab
					void navigate({ to: "/band/me", search: { tab: "messages" } });
				}}
			/>
		</>
	);
};

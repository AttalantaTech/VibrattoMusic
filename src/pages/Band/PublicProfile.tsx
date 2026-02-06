import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	Clock4,
	Disc,
	Heart,
	MapPin,
	MessageCircle,
	TrendingUp,
	Verified,
} from "lucide-react";

import { MainLayout } from "../../components/layout/MainLayout";
import { Button } from "../../components/ui/Button/Button";
import { TabNavigation } from "../../components/ui/TabNavigation/TabNavigation";
import { IconButton } from "../../components/ui/IconButton/IconButton";
import { IconOnlyButton } from "../../components/ui/IconOnlyButton/IconOnlyButton";
import { LazyImage } from "../../components/ui/LazyImage/LazyImage";
import { ArtistCard } from "../../components/cards/ArtistCard/ArtistCard";
import {
	useSearchMusicalProducts,
	useMusicalProduct,
} from "../../hooks/useMusicalProducts";
import { useAuthStore } from "../../store/authStore";
import { useToggleFavorite, useFavorites } from "../../hooks/useUser";
import { extractYouTubeId } from "../../lib/utils/cn";
import type { MusicalProductApiResponse } from "../../api/types";
import { StartConversationModal } from "../../components/BandProfile/Messages/components/StartConversationModal";
import { useStartConversation } from "../../hooks/useMessaging";
import { toast } from "sonner";

const styles = {
	genre: "font-medium text-[#085EC5] bg-[#D6F2FF] py-[2x] px-2 rounded-2xl",
	subtitle: "text-gray-500 text-xs flex w-full items-start justify-start",
	artistInfoBox:
		"flex flex-col w-full h-full items-center justify-center gap-[6px]",
	section: "flex flex-col w-full gap-[6px] items-start justify-start",
};

export const PublicBandProfile = () => {
	const { id } = useParams({ from: "/band/profile/$id" });
	const navigate = useNavigate();
	const [activeSecondaryTab, setActiveSecondaryTab] = useState("photos");
	const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);

	// Auth and favorites
	const { isAuthenticated } = useAuthStore();
	const { data: favorites } = useFavorites(isAuthenticated);
	const toggleFavoriteMutation = useToggleFavorite();

	// Start conversation hook
	const startConversationMutation = useStartConversation();

	// Parse ID from URL parameter
	const bandId = Number(id);

	// Fetch band data
	const {
		data: bandList,
		isLoading: bandLoading,
		error,
	} = useMusicalProduct(bandId, bandId > 0 && !isNaN(bandId)) as {
		data: Array<MusicalProductApiResponse> | undefined;
		isLoading: boolean;
		error: any;
	};

	const band = bandList?.[0];

	// Search for similar artists
	const { data: similarArtists, isLoading: similarArtistsLoading } =
		useSearchMusicalProducts(
			{
				generosMusicais: band?.generoMusical?.map((g) => g.id) || [1, 2],
				limite: 4,
				ordenarPorAvaliacao: true,
				tamanhoPagina: 4,
				pagina: 1,
			},
			!!band
		);

	// Secondary tabs for gallery
	const secondaryTabs = [
		{ label: "Fotos", value: "photos" },
		{ label: "Vídeos", value: "videos" },
		{ label: "Clipagens", value: "clippings" },
	];

	// Handler for favorite toggle
	const handleFavoriteToggle = (productId: number) => {
		if (isAuthenticated) {
			toggleFavoriteMutation.mutate({ produtoMusicalId: productId });
		}
	};

	// Handler for request quote button
	const handleRequestQuote = () => {
		if (!isAuthenticated) {
			toast.error("Você precisa estar logado para solicitar um orçamento");
			void navigate({ to: "/login" });
			return;
		}
		setIsConversationModalOpen(true);
	};

	// Loading state
	if (bandLoading) {
		return (
			<MainLayout>
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Carregando perfil da banda...</p>
					</div>
				</div>
			</MainLayout>
		);
	}

	// Error state
	if (error || !band) {
		return (
			<MainLayout>
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Dados não encontrados
						</h2>
						<p className="text-gray-600 mb-4">
							Os dados da banda que você está procurando não foram encontrados.
						</p>
						<Button onClick={() => navigate({ to: "/" })}>
							Voltar para a página inicial
						</Button>
					</div>
				</div>
			</MainLayout>
		);
	}

	// Check if band is in favorites
	const isFavorite = favorites?.data?.some((f) => f.id === band.id) ?? false;

	return (
		<MainLayout>
			{/* Back button */}
			<div className="w-full px-4 sm:px-6 lg:px-8 xl:px-14 pt-4">
				<Button
					variant="outline"
					onClick={() => navigate({ to: "/" })}
					className="flex items-center gap-2"
				>
					<ArrowLeft size={16} />
					Voltar
				</Button>
			</div>

			<main className="flex flex-col w-full min-h-screen items-start justify-start p-4 sm:p-6 lg:p-8 xl:p-14">
				<div className="flex flex-col lg:flex-row w-full items-start gap-4 lg:gap-8 justify-start lg:justify-center max-w-7xl mx-auto">
					{/* Main Content */}
					<div className="flex flex-col w-full lg:flex-1 h-full items-center justify-start gap-4 lg:gap-8 order-2 lg:order-1">
						{/* Picture and info */}
						<section className="flex flex-col lg:flex-row pt-0 lg:pt-6 w-full items-center lg:items-start justify-start gap-4 lg:gap-6">
							<LazyImage
								alt="Band cover"
								className="rounded-lg w-full max-w-sm lg:w-72 h-40 sm:h-48 lg:h-52 object-cover"
								src={band.fotoPerfil}
							/>
							<div className="flex flex-col w-full h-full items-center lg:items-start justify-center gap-4">
								{/* Basic info */}
								<div className={`${styles.artistInfoBox} lg:items-start`}>
									<div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 w-full">
										<div className="flex flex-col items-center sm:items-start gap-2 w-full">
											<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
												Nome da Banda
											</h2>
											<div className="flex items-center gap-3">
												<h1 className="text-gray-900 font-bold text-xl sm:text-2xl">
													{band.nome}
												</h1>
												<Verified color="#3E97FF" size={24} />
											</div>
											{/* Genres */}
											<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
												{band.generoMusical?.map((genero) => (
													<span
														key={genero.id}
														className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
													>
														{genero.nome}
													</span>
												)) || (
													<>
														<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
															Forró
														</span>
														<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
															Sertanejo
														</span>
													</>
												)}
											</div>
										</div>
									</div>
								</div>

								{/* Location */}
								<div className={`${styles.artistInfoBox} lg:items-start`}>
									<div className="flex flex-col items-center sm:items-start gap-3 w-full">
										<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
											Localização
										</h2>
										<div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 w-full">
											<div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
												<MapPin size={18} className="text-gray-600" />
												<span className="text-gray-900 font-semibold">
													{band.cidade?.nome || "Localização não informada"}
												</span>
											</div>
											{band.podeDeslocamento && (
												<span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
													Itinerante
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Social Media */}
								{band.redeSocial && band.redeSocial.length > 0 && (
									<div className={`${styles.artistInfoBox} lg:items-start`}>
										<div className="flex flex-col items-center sm:items-start gap-3 w-full">
											<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
												Redes Sociais
											</h2>
											<div className="flex flex-wrap gap-3 justify-center sm:justify-start">
												{band.redeSocial.map((social, index) => (
													<a
														key={social.idRedeSocial || index}
														href={social.link}
														target="_blank"
														rel="noopener noreferrer"
														className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
													>
														{social.nomeRedeSocial || "Rede Social"}
													</a>
												))}
											</div>
										</div>
									</div>
								)}
							</div>
						</section>

						{/* Event Types */}
						{band.tipoEvento && band.tipoEvento.length > 0 && (
							<section className={styles.section}>
								<div className="flex flex-col items-center lg:items-start gap-4 w-full">
									<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
										Tipos de Eventos
									</h2>
									<div className="flex flex-wrap w-full items-center justify-center lg:justify-start gap-3">
										{band.tipoEvento.map((tipo, index) => (
											<div
												key={tipo.id || index}
												className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium"
											>
												<Disc size={18} />
												<span>{tipo.nome}</span>
											</div>
										))}
									</div>
								</div>
							</section>
						)}

						{/* Band Description */}
						{band.descricao && (
							<section className={styles.section}>
								<h2 className={styles.subtitle}>Sobre a banda</h2>
								<p className="text-sm lg:text-lg text-gray-800 text-justify">
									{band.descricao}
								</p>
							</section>
						)}

						{/* Gallery */}
						{band.imagens && band.imagens.length > 0 && (
							<>
								<section className={styles.section}>
									<div className="grid grid-cols-1 sm:grid-cols-2 w-full rounded-lg gap-2 mb-2">
										{band.imagens.slice(0, 2).map((image, index) => (
											<LazyImage
												key={image.id || index}
												alt="Band gallery photo"
												className="rounded-lg w-full h-48 sm:h-64 lg:h-[280px] object-cover"
												src={image.link}
											/>
										))}
									</div>
									<div className="w-full flex items-center justify-center sm:justify-start gap-5">
										<IconOnlyButton
											disabled
											icon={<ArrowLeft size={15} />}
											shape="circle"
											variant="outline"
										/>
										<IconOnlyButton
											icon={<ArrowRight size={15} />}
											shape="circle"
											variant="outline"
										/>
									</div>
								</section>

								<section
									className={styles.section.replace("gap-[6px]", "gap-8")}
								>
									<TabNavigation
										currentTab={activeSecondaryTab}
										tabs={secondaryTabs}
										variant="underline"
										onChange={setActiveSecondaryTab}
									/>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 w-full h-full gap-4">
										{band.imagens.map((image, index) => (
											<LazyImage
												key={image.id || index}
												alt="Band image"
												className="rounded-lg w-full h-64 sm:h-[305px] object-cover"
												src={image.link}
											/>
										))}
									</div>
									<hr className="w-full text-gray-200" />
								</section>
							</>
						)}

						{/* Similar Artists */}
						<section className={styles.section}>
							<div className="flex flex-col items-center lg:items-start gap-6 w-full">
								<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
									Você também pode gostar
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 w-full gap-6">
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
									) : (similarArtists?.data?.length ?? 0) > 0 ? (
										// Real API data
										(similarArtists?.data ?? [])
											.filter((product) => product.id !== band.id) // Exclude current band
											.slice(0, 2)
											.map((product) => (
												<div
													key={product.id}
													className="w-full flex items-center justify-center"
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
					<div className="w-full lg:w-80 xl:w-96 border border-gray-200 rounded-lg flex flex-col gap-4 lg:gap-6 p-4 lg:p-6 shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08)] order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
						{/* Media content (YouTube or Spotify) */}
						{band.videosYouTube && band.videosYouTube.length > 0 ? (
							(() => {
								const video =
									band.videosYouTube.find((item) => item)?.link ?? "";
								const videoId = extractYouTubeId(video);
								return videoId ? (
									<div
										className="relative w-full rounded-lg overflow-hidden"
										style={{ paddingBottom: "56.25%" }}
									>
										<iframe
											className="absolute top-0 left-0 w-full h-full"
											src={`https://www.youtube.com/embed/${videoId}`}
											title="YouTube video"
											frameBorder="0"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowFullScreen
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
											src={band.fotoPerfil}
										/>
									</a>
								);
							})()
						) : band.spotifyPlaylistId ? (
							<div className="w-full rounded-lg overflow-hidden">
								<iframe
									src={`https://open.spotify.com/embed/playlist/${band.spotifyPlaylistId}`}
									width="100%"
									height="352"
									frameBorder="0"
									allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
									loading="lazy"
								/>
							</div>
						) : (
							<LazyImage
								alt="Band photo"
								className="rounded-lg h-40 sm:h-48 lg:h-[180px] w-full object-cover"
								src={band.fotoPerfil}
							/>
						)}

						{/* Action buttons */}
						<IconButton
							icon={<MessageCircle size={20} />}
							onClick={handleRequestQuote}
							disabled={startConversationMutation.isPending}
						>
							{startConversationMutation.isPending
								? "Carregando..."
								: "Solicitar Orçamento"}
						</IconButton>
						<IconButton
							icon={<Heart size={20} />}
							variant="outline"
							onClick={() => {
								handleFavoriteToggle(band.id);
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

						{/* Info cards */}
						<div className="flex flex-col w-full text-gray-600 gap-4">
							<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
								<Clock4 size={20} className="flex-shrink-0 text-blue-600" />
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
						{band.valorServico && (
							<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
								<div className="text-center">
									<span className="text-sm text-blue-700 font-medium">
										A partir de
									</span>
									<div className="text-2xl font-bold text-blue-900">
										R$ {band.valorServico.toLocaleString("pt-BR")}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</main>

			{/* Start Conversation Modal */}
			<StartConversationModal
				isOpen={isConversationModalOpen}
				onClose={() => {
					setIsConversationModalOpen(false);
				}}
				participantId={band.id}
				participantName={band.nome}
				onConversationStarted={() => {
					setIsConversationModalOpen(false);
					toast.success("Conversa iniciada com sucesso!");
					// Navigate to band me messages tab
					void navigate({ to: "/band/me", search: { tab: "messages" } });
				}}
			/>
		</MainLayout>
	);
};

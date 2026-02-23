import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
	Clock4,
	Disc,
	Heart,
	MapPin,
	MessageCircle,
	Star,
	TrendingUp,
	Verified,
} from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button/Button";
import { TabNavigation } from "@/components/ui/TabNavigation/TabNavigation";
import { IconButton } from "@/components/ui/IconButton/IconButton";
import { LazyImage } from "@/components/ui/LazyImage/LazyImage";
import { ArtistCard } from "@/components/cards/ArtistCard/ArtistCard";

import { useAuthStore } from "@/store/authStore";
import { useToggleFavorite, useFavorites } from "@/hooks/useUser";
import { extractYouTubeId } from "@/lib/utils/cn";
import type {
	MusicalProduct,
	MusicalProductListApiResponse,
} from "@/api/types";
import { StartConversationModal } from "@/components/BandProfile/Messages/components/StartConversationModal";
import { useStartConversation } from "@/hooks/useMessaging";
import { toast } from "sonner";
import { RatingBars } from "@/components/RatingBars/RatingBars";
import { RatingComment } from "@/components/RatingComment/RatingComment";
import { Carousel } from "@/components/ui/Carousel/Carousel";
import { CarouselItem } from "@/components/ui/carousel";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { StageMapArea } from "@/components/StageMap/StageMapArea";
import { useInstrumentos } from "@/hooks/useFilters";

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
	const [activeTab, setActiveTab] = useState("stageMap");
	const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);

	// Auth and favorites
	const { isAuthenticated } = useAuthStore();
	const { data: favorites } = useFavorites(isAuthenticated);
	const toggleFavoriteMutation = useToggleFavorite();
	const { user } = useProfileStatus();
	const { data: instrumentsData } = useInstrumentos();

	// Start conversation hook
	const startConversationMutation = useStartConversation();

	// Secondary tabs for gallery
	const secondaryTabs = [
		{ label: "Mapa de Palco", value: "stageMap" },
		{ label: "Rider Técnico", value: "technicalRider" },
		{ label: "Camarim", value: "dressingRoom" },
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

	const renderTabContent = (): ReactNode => {
		switch (activeTab) {
			case "stageMap":
				if (musicalProduct?.mapaPalco.length === 0) {
					return (
						<div className="flex items-center justify-center w-full min-h-[380px] bg-gray-100">
							<span className="block text-center text-sm text-gray-600">
								Nenhum mapa de palco definido
							</span>
						</div>
					);
				} else {
					return (
						<>
							<StageMapArea
								musicalProduct={musicalProduct}
								instrumentsData={instrumentsData}
							/>
						</>
					);
				}
			case "technicalRider":
				if (musicalProduct?.rider) {
					return (
						<div className="flex w-full min-h-[680px]">
							<embed className="w-full" src={musicalProduct.rider} />
						</div>
					);
				} else if (musicalProduct?.riderTexto) {
					return (
						<div className="flex justify-center items-center p-4 max-w-screen-md min-h-[480px]">
							<div
								className="bg-gray-100"
								dangerouslySetInnerHTML={{ __html: musicalProduct.riderTexto }}
							/>
						</div>
					);
				} else {
					return (
						<div className="flex items-center justify-center w-full min-h-[380px] bg-gray-100">
							<span className="block text-center text-sm text-gray-600">
								Nenhum texto ou arquivo de rider técnico definido
							</span>
						</div>
					);
				}
			default:
				if (musicalProduct?.infraCamarim) {
					return (
						<div className="flex w-full min-h-[680px]">
							<embed className="w-full" src={musicalProduct.infraCamarim} />
						</div>
					);
				} else if (musicalProduct?.infraCamarimTexto) {
					return (
						<div className="flex justify-center items-center p-4 max-w-screen-md min-h-[480px]">
							<div
								className="bg-gray-100"
								dangerouslySetInnerHTML={{
									__html: musicalProduct.infraCamarimTexto,
								}}
							/>
						</div>
					);
				} else {
					return (
						<div className="flex items-center justify-center w-full min-h-[380px] bg-gray-100">
							<span className="block text-center text-sm text-gray-600">
								Nenhum texto ou arquivo de infraestrutura de camarim definido
							</span>
						</div>
					);
				}
		}
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
	if (!musicalProduct?.id) {
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

	// Check if musicalProduct is in favorites
	const isFavorite =
		favorites?.data?.some((f) => f.id === musicalProduct.id) ?? false;

	return (
		<>
			<main className="flex flex-col w-full min-h-screen items-start justify-start">
				<div className="flex flex-col lg:flex-row w-full items-start gap-4 lg:gap-8 justify-start lg:justify-center max-w-7xl mx-auto">
					{/* Main Content */}
					<div className="flex flex-col w-full lg:flex-1 h-full items-center justify-start gap-4 lg:gap-8 order-2 lg:order-1">
						{/* Picture and info */}
						<section className="flex flex-col lg:flex-row pt-0 lg:pt-6 w-full items-center lg:items-start justify-start gap-4 lg:gap-6">
							<LazyImage
								alt="Band cover"
								className="rounded-lg w-full max-w-sm lg:w-72 h-40 sm:h-48 lg:h-52 object-cover"
								src={musicalProduct.fotoPerfil}
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
													{musicalProduct.nome}
												</h1>
												<Verified color="#3E97FF" size={24} />
											</div>

											{/* Genres */}
											<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
												{musicalProduct.generoMusical?.map((genero) => (
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
													{musicalProduct.cidade?.nome ||
														"Localização não informada"}
												</span>
											</div>
											{musicalProduct.podeDeslocamento && (
												<span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
													Itinerante
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Social Media */}
								{musicalProduct.redeSocial &&
									musicalProduct.redeSocial.length > 0 && (
										<div className={`${styles.artistInfoBox} lg:items-start`}>
											<div className="flex flex-col items-center sm:items-start gap-3 w-full">
												<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
													Redes Sociais
												</h2>
												<div className="flex flex-wrap gap-3 justify-center sm:justify-start">
													{musicalProduct.redeSocial.map((social, index) => (
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
						{musicalProduct.tipoEvento &&
							musicalProduct.tipoEvento.length > 0 && (
								<section className={styles.section}>
									<div className="flex flex-col items-center lg:items-start gap-4 w-full">
										<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
											Tipos de Eventos
										</h2>
										<div className="flex flex-wrap w-full items-center justify-center lg:justify-start gap-3">
											{musicalProduct.tipoEvento.map((tipo, index) => (
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
						{musicalProduct.descricao && (
							<section className={styles.section}>
								<h2 className={styles.subtitle}>Sobre a banda</h2>
								<p className="text-sm lg:text-lg text-gray-800 text-justify">
									{musicalProduct.descricao}
								</p>
							</section>
						)}

						{/* Gallery */}
						<section className={styles.section}>
							<div className="w-full flex items-center justify-center">
								{musicalProduct && musicalProduct?.imagens.length > 0 && (
									<Carousel>
										{musicalProduct.imagens.map((image, index) => (
											<CarouselItem
												key={index}
												className=" basis-full md:basis-1/2 lg:basis-1/3"
											>
												<LazyImage
													key={image.id || index}
													alt="Band gallery photo"
													className="rounded-lg w-full h-48 sm:h-64 lg:h-[280px] object-cover"
													src={image.link}
												/>
											</CarouselItem>
										))}
									</Carousel>
								)}
							</div>
						</section>

						<section className={styles.section.replace("gap-[6px]", "gap-8")}>
							<TabNavigation
								currentTab={activeTab ?? "stageMap"}
								tabs={secondaryTabs}
								variant="underline"
								onChange={setActiveTab}
							/>

							<div className="flex flex-col bg-gray-100 lg:flex-row w-full items-start gap-4 lg:gap-8 justify-start lg:justify-center max-w-9xl overflow-auto">
								{renderTabContent()}
							</div>

							<hr className="w-full text-gray-200" />
						</section>

						{/* Customer Reviews */}
						<section className={styles.section}>
							<div className="flex flex-col items-center lg:items-start gap-6 w-full">
								<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
									Avaliações dos Clientes
								</h2>
								<div className="flex flex-col lg:flex-row w-full items-center lg:items-start gap-8 bg-gray-50 rounded-xl p-6">
									<div className="flex flex-col gap-3 items-center lg:items-start">
										<div className="text-center lg:text-left">
											<h1 className="text-blue-600 font-bold text-4xl">
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
									) : (similarArtists?.data?.length ?? 0) > 0 ? (
										// Real API data
										(similarArtists?.data ?? [])
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
					{musicalProduct.usuario.id !== user?.id ? (
						<div className="w-full lg:w-80 xl:w-96 border border-gray-200 rounded-lg flex flex-col gap-4 lg:gap-6 p-4 lg:p-6 shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08)] order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
							{/* Media content (YouTube or Spotify) */}
							{musicalProduct.videosYouTube &&
							musicalProduct.videosYouTube.length > 0 ? (
								(() => {
									const video =
										musicalProduct.videosYouTube.find((item) => item)?.link ??
										"";
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
												src={musicalProduct.fotoPerfil}
											/>
										</a>
									);
								})()
							) : musicalProduct.spotifyPlaylistId ? (
								<div className="w-full rounded-lg overflow-hidden">
									<iframe
										src={`https://open.spotify.com/embed/playlist/${musicalProduct.spotifyPlaylistId}`}
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
									src={musicalProduct.fotoPerfil}
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
							{musicalProduct.valorServico ? (
								<div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
									<div className="text-center">
										<span className="text-sm text-blue-700 font-medium">
											A partir de
										</span>
										<div className="text-2xl font-bold text-blue-900">
											R$ {musicalProduct.valorServico.toLocaleString("pt-BR")}
										</div>
									</div>
								</div>
							) : null}
						</div>
					) : (
						<div className="w-full lg:w-80 xl:w-96 border border-gray-200 rounded-lg flex flex-col gap-4 lg:gap-6 p-4 lg:p-6 shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08)] order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
							{/* Media content (YouTube or Spotify) */}
							{musicalProduct.videosYouTube &&
							musicalProduct.videosYouTube.length > 0 ? (
								(() => {
									const video =
										musicalProduct.videosYouTube.find((item) => item)?.link ??
										"";
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
												src={musicalProduct.fotoPerfil}
											/>
										</a>
									);
								})()
							) : musicalProduct.spotifyPlaylistId ? (
								<div className="w-full rounded-lg overflow-hidden">
									<iframe
										src={`https://open.spotify.com/embed/playlist/${musicalProduct.spotifyPlaylistId}`}
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
									src={musicalProduct.fotoPerfil}
								/>
							)}
						</div>
					)}
				</div>
			</main>

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

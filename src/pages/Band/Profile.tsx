import {
	ArrowLeft,
	ArrowRight,
	Disc,
	GraduationCap,
	Heart,
	MapPin,
	Star,
	Verified,
} from "lucide-react";
import { Button } from "../../components/ui/Button/Button";
import { useState } from "react";
import { TabNavigation } from "../../components/ui/TabNavigation/TabNavigation";
import { IconOnlyButton } from "../../components/ui/IconOnlyButton/IconOnlyButton";
import { LazyImage } from "../../components/ui/LazyImage/LazyImage";
import { RatingBars } from "../../components/RatingBars/RatingBars";
import { RatingComment } from "../../components/RatingComment/RatingComment";
import { useAuthStore } from "../../store/authStore";
import { ImprovedSettingsTab } from "../../components/BandProfile/Settings/ImprovedSettingsTab";
import { MainLayout } from "../../components/layout/MainLayout/MainLayout";
import { AgendaTab } from "../../components/BandProfile/Agenda/AgendaTab";
import { ConsolidadoVendasTab } from "../../components/BandProfile/MySales/ConsolidadoVendasTab";
import { FavoritesTab } from "../../components/BandProfile/Favorites/FavoritesTab";
import { OnboardingProvider } from "../../contexts/OnboardingContext";
import { useTabWithUrl } from "../../hooks/useTabWithUrl";
import { MyHiresTab } from "../../components/BandProfile/Hires/MyHiresTab";
import { useQuery } from "@tanstack/react-query";
import { musicalProductService } from "../../api";
import { useActiveMusicalProduct } from "../../hooks/useActiveMusicalProduct";
import MessagesTab from "../../components/BandProfile/Messages";
import { ProposalsTab } from "../../components/BandProfile/Proposals/ProposalsTab";
import { ContractsTab } from "../../components/BandProfile/Contracts/ContractsTab";
import { MessagesContextProvider } from "@/components/BandProfile/Messages/contexts/MessagesContext/provider";

const styles = {
	genre: "font-medium text-[#085EC5] bg-[#D6F2FF] py-[2x] px-2 rounded-2xl",
	subtitle: "text-gray-500 text-xs flex w-full items-start justify-start",
	artistInfoBox:
		"flex flex-col w-full h-full items-center justify-center gap-[6px]",
	section: "flex flex-col w-full gap-[6px] items-start justify-start",
};

export const BandProfile = () => {
	// Use URL-synced tab state
	const [activeMainTab, setActiveMainTab] = useTabWithUrl(
		"/band/me",
		"messages"
	);

	// Auth and favorites
	const { user } = useAuthStore();

	// Get active musical product state
	const { activeProduct, getActiveProductData } = useActiveMusicalProduct();

	// Secondary tab state for the gallery/clipping section
	const secondaryTabs = [
		{ label: "Fotos", value: "photos" },
		{ label: "Vídeos", value: "videos" },
		{ label: "Clipagens", value: "clippings" },
	];
	const [activeSecondaryTab, setActiveSecondaryTab] = useState(
		secondaryTabs.length > 0 ? secondaryTabs[0]?.value : ""
	);
	// API hooks integration
	// const { data: generos } = useGenerosMusicais(); // Not currently used

	// Fetch user's musical products to determine if sales tab should be shown
	const { data: myProducts, isLoading: myProductsLoading } = useQuery({
		queryKey: ["myMusicalProducts"],
		queryFn: () => musicalProductService.getMyProducts(),
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	// Get active musical product data - always use the active product when available
	const activeProductData = getActiveProductData();
	// If no active product data but we have products from API, use the first one as default
	const currentProduct = activeProductData || myProducts?.data?.[0];

	// Get the active product ID for child components
	const activeProductId = activeProduct?.id
		? parseInt(activeProduct.id)
		: undefined;

	// Check if user has musical products to show sales tab
	const hasMusicalProducts = myProducts?.data && myProducts.data.length > 0;

	const mainTabs = [
		{ label: "Conta", value: "account" },
		{ label: "Mensagens", value: "messages" /* , badgeCount: 4 */ },
		{ label: "Agenda", value: "bookings" },
		...(hasMusicalProducts ? [{ label: "Vendas", value: "sales" }] : []),
		/* { label: "Contratações", value: "hires" }, */
		/* { label: "Propostas", value: "proposals" }, */
		{ label: "Contratos", value: "contracts" },
		{ label: "Favoritos", value: "favorites" },
		{ label: "Ajustes", value: "settings" },
	]; // Function to render content based on active tab
	const renderTabContent = () => {
		switch (activeMainTab) {
			case "bookings":
				return <AgendaTab productId={activeProductId} />;
			case "settings":
				return (
					<OnboardingProvider>
						<ImprovedSettingsTab />
					</OnboardingProvider>
				);
			case "messages":
				return (
					<MessagesContextProvider>
						<MessagesTab />
					</MessagesContextProvider>
				);
			case "sales":
				return hasMusicalProducts ? (
					<ConsolidadoVendasTab productId={activeProductId} />
				) : null;
			case "hires":
				return <MyHiresTab />;
			case "proposals":
				return <ProposalsTab productId={activeProductId} />;
			case "contracts":
				return <ContractsTab />;
			case "favorites":
				return <FavoritesTab />;
			case "account":
			default:
				return (
					<>
						{/* Account content with side card */}
						<div className="flex flex-col w-full lg:flex-1 h-full items-center justify-start gap-4 lg:gap-8 order-2 lg:order-1">
							{/* Picture and info*/}
							<section className="flex flex-col lg:flex-row pt-0 lg:pt-6 w-full items-center lg:items-start justify-start gap-4 lg:gap-6">
								{" "}
								<LazyImage
									alt="Band cover"
									className="rounded-lg w-full max-w-sm lg:w-72 h-40 sm:h-48 lg:h-52 object-cover"
									src={currentProduct?.fotoPerfil || ""}
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
														{myProductsLoading ? (
															<div className="bg-gray-200 animate-pulse h-8 w-48 rounded"></div>
														) : (
															currentProduct?.nome ||
															user?.nome ||
															"Nome da Banda"
														)}
													</h1>
													<Verified color="#3E97FF" size={24} />
												</div>
												{/* Dynamic genres from API */}
												<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
													{myProductsLoading ? (
														<>
															<div className="bg-gray-200 animate-pulse h-6 w-16 rounded-2xl"></div>
															<div className="bg-gray-200 animate-pulse h-6 w-20 rounded-2xl"></div>
														</>
													) : (
														currentProduct?.generoMusical &&
														currentProduct.generoMusical.length > 0 &&
														currentProduct.generoMusical
															.slice(0, 2)
															.map((genero) => (
																<span
																	key={genero.id}
																	className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
																>
																	{genero.nome}
																</span>
															))
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
														{myProductsLoading ? (
															<div className="bg-gray-200 animate-pulse h-5 w-32 rounded"></div>
														) : (
															currentProduct?.cidade?.nome ||
															"Cidade não informada"
														)}
													</span>
												</div>
												{!myProductsLoading &&
													currentProduct?.podeDeslocamento && (
														<span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
															Itinerante
														</span>
													)}
											</div>
										</div>
									</div>

									{/* Social Media */}
									<div className={`${styles.artistInfoBox} lg:items-start`}>
										<div className="flex flex-col items-center sm:items-start gap-3 w-full">
											<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
												Redes Sociais
											</h2>
											<div className="flex flex-wrap gap-3 justify-center sm:justify-start">
												{myProductsLoading ? (
													<>
														<div className="bg-gray-200 animate-pulse h-9 w-24 rounded-lg"></div>
														<div className="bg-gray-200 animate-pulse h-9 w-24 rounded-lg"></div>
													</>
												) : (
													currentProduct?.redeSocial &&
													currentProduct.redeSocial.length > 0 &&
													currentProduct.redeSocial.map((social) => (
														<span
															key={social.idRedeSocial}
															className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
														>
															@{social.nomeRedeSocial || social.link}
														</span>
													))
												)}
											</div>
										</div>
									</div>
								</div>
							</section>

							{/* Plays in*/}
							<section className={styles.section}>
								<div className="flex flex-col items-center lg:items-start gap-4 w-full">
									<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
										Tipos de Eventos
									</h2>
									<div className="flex flex-wrap w-full items-center justify-center lg:justify-start gap-3">
										{myProductsLoading ? (
											<>
												<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>
												<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>
												<div className="bg-gray-200 animate-pulse h-10 w-32 rounded-lg"></div>
											</>
										) : currentProduct?.tipoEvento &&
										  currentProduct.tipoEvento.length > 0 ? (
											currentProduct.tipoEvento.map((evento) => {
												let icon = Disc;
												let bgColor = "bg-gray-50";
												let borderColor = "border-gray-200";
												let textColor = "text-gray-700";

												if (evento.nome.toLowerCase().includes("casamento")) {
													icon = Heart;
													bgColor = "bg-red-50";
													borderColor = "border-red-200";
													textColor = "text-red-700";
												} else if (
													evento.nome.toLowerCase().includes("formatura")
												) {
													icon = GraduationCap;
													bgColor = "bg-blue-50";
													borderColor = "border-blue-200";
													textColor = "text-blue-700";
												} else if (evento.nome.toLowerCase().includes("show")) {
													icon = Disc;
													bgColor = "bg-purple-50";
													borderColor = "border-purple-200";
													textColor = "text-purple-700";
												}

												const Icon = icon;
												return (
													<div
														key={evento.id}
														className={`flex items-center gap-2 px-4 py-2 ${bgColor} border ${borderColor} rounded-lg ${textColor} font-medium`}
													>
														<Icon size={18} />
														<span>{evento.nome}</span>
													</div>
												);
											})
										) : null}
									</div>
								</div>
							</section>

							{/* Band History*/}
							<section className={styles.section}>
								<h2 className={styles.subtitle}>História da banda</h2>
								{myProductsLoading ? (
									<div className="space-y-2">
										<div className="bg-gray-200 animate-pulse h-4 w-full rounded"></div>
										<div className="bg-gray-200 animate-pulse h-4 w-full rounded"></div>
										<div className="bg-gray-200 animate-pulse h-4 w-3/4 rounded"></div>
									</div>
								) : (
									<p className="text-sm lg:text-lg text-gray-800 text-start">
										{currentProduct?.descricao ||
											"Adicione uma descrição da sua banda para que os clientes " +
												"possam conhecer melhor o seu trabalho, história e estilo " +
												"musical. Conte sobre a formação, os integrantes, o estilo " +
												"musical e os principais shows realizados."}
									</p>
								)}
							</section>

							{/* Pictures*/}
							<section className={styles.section}>
								<div className="grid grid-cols-1 sm:grid-cols-2 w-full rounded-lg gap-2 mb-2">
									{myProductsLoading
										? Array.from({ length: 2 }).map((_, index) => (
												<div
													key={`gallery-skeleton-${index}`}
													className="bg-gray-200 animate-pulse rounded-lg w-full h-48 sm:h-64 lg:h-[280px]"
												/>
											))
										: null}
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

							<section className={styles.section.replace("gap-[6px]", "gap-8")}>
								<TabNavigation
									currentTab={activeSecondaryTab ?? "photos"}
									tabs={secondaryTabs}
									variant="underline"
									onChange={setActiveSecondaryTab}
								/>{" "}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 w-full h-full gap-4">
									{Array.from({ length: 4 }).map((_, index) => (
										<LazyImage
											key={`clipping-${index}`}
											alt="Clipagem"
											className="rounded-lg w-full h-64 sm:h-[305px] object-cover"
											src={undefined}
										/>
									))}
								</div>
								<hr className="w-full text-gray-200" />
							</section>

							<section className={styles.section}>
								<div className="flex flex-col items-center lg:items-start gap-6 w-full">
									<h2 className="text-gray-500 text-xs uppercase tracking-wide font-medium">
										Avaliações dos Clientes
									</h2>
									<div className="flex flex-col lg:flex-row w-full items-center lg:items-start gap-8 bg-gray-50 rounded-xl p-6">
										<div className="flex flex-col gap-3 items-center lg:items-start">
											<div className="text-center lg:text-left">
												<h1 className="text-blue-600 font-bold text-4xl">
													{myProductsLoading ? (
														<div className="bg-gray-200 animate-pulse h-10 w-16 rounded"></div>
													) : (
														currentProduct?.avaliacao?.toFixed(1) || "4.5"
													)}
												</h1>
												<p className="text-gray-600 text-sm">de 5 estrelas</p>
											</div>
											<div className="text-center lg:text-left">
												<span className="text-gray-700 font-medium text-sm">
													Baseado em{" "}
												</span>
												<span className="text-gray-900 font-semibold text-sm">
													{myProductsLoading ? (
														<div className="bg-gray-200 animate-pulse h-4 w-24 rounded inline-block"></div>
													) : (
														<>
															{currentProduct?.avaliacao ? "Várias" : "845"}{" "}
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
							</section>
						</div>
					</>
				);
		}
	};
	return (
		<MainLayout>
			{/* Tab Navigation - specific to band profile */}
			<div className="w-full h-16 sm:h-18 border-b border-gray-100 overflow-x-auto scrollbar-hide flex items-center">
				<TabNavigation
					currentTab={activeMainTab}
					tabs={mainTabs}
					onChange={setActiveMainTab}
				/>
			</div>

			<main className="flex flex-col w-full h-fit items-start justify-start p-4 sm:p-6 lg:p-8 xl:p-10">
				<div className="flex flex-col lg:flex-row w-full items-start gap-4 lg:gap-8 justify-start lg:justify-center max-w-9xl mx-auto">
					{/* Content */}
					{renderTabContent()}
				</div>
			</main>
		</MainLayout>
	);
};

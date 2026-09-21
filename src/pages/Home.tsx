import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	ArrowRight,
	Facebook,
	SlidersHorizontal,
	Instagram,
	MapPin,
	Search,
} from "lucide-react";

import { LazyImage } from "../components/ui/LazyImage/LazyImage";

import type { FunctionComponent } from "../common/types";
import { MainLayout } from "../components/layout/MainLayout";
import { Button } from "../components/ui/Button/Button";
import { DropdownSelect } from "../components/ui/DropdownSelect/DropdownSelect";
import { ArtistCardWithFavorites } from "../components/cards/ArtistCard/ArtistCardWithFavorites";
import { PromoCard } from "../components/cards/PromoCard/PromoCard";
import { TestimonialCard } from "../components/cards/TestimonialCard/TestimonialCard";
import { FAQAccordion } from "../components/cards/FAQAccordion/FAQAccordion";
import { VibrattoLogo } from "../components/VibrattoLogo/VibrattoLogo";
import { useAuthStore } from "../store/authStore";
// Removed imports that are now handled by ArtistCardWithFavorites
import { useHomePageImages } from "../hooks/useFilters";
import { useSearchMusicalProducts } from "../hooks/useMusicalProducts";
import type { MusicalProductSearchRequest } from "@/api/types";
import { useUser } from "@/hooks/useUser";
import { InputField } from "@/components/forms/InputField/InputField";
import { useDebounce } from "@/hooks/useDebounceSimple";
import { useFilterLookup } from "@/domains/MusicalProfile/hooks/useFilterLookup";

const promos = [
	{
		title: "Encontre a opção perfeita para o seu evento",
		description: "Escolha entre bandas, trios e muitas mais!",
		imgSrc: undefined,
	},
	{
		title: "Transforme seu evento com os melhores profissionais",
		description: "Produtores, roadies e muito mais à sua disposição.",
		imgSrc: undefined,
	},
	{
		title: "Para todas as ocasiões:",
		description: "Casamentos, bares, formaturas e muito mais",
		imgSrc: undefined, // This will show the placeholder
	},
	{
		title: "Para todas as ocasiões:",
		description: "Casamentos, bares, formaturas e muito mais",
		imgSrc: undefined,
	},
	{
		title: "Para todas as ocasiões:",
		description: "Casamentos, bares, formaturas e muito mais",
		imgSrc: undefined, // This will show the placeholder
	},
];

const faqData = [
	{
		question: "O que é Lorem Ipsum?",
		answer:
			"Lorem Ipsum é simplesmente uma simulação de texto da indústria tipográfica.",
	},
	{
		question: "Por que usamos isso?",
		answer:
			"É um fato conhecido de que um leitor se distrairá com o conteúdo legível.",
	},
	{
		question: "De onde vem?",
		answer:
			"Contrary to popular belief, Lorem Ipsum não é simplesmente texto aleatório.",
	},
];

export const Home = (): FunctionComponent => {
	const { isAuthenticated } = useAuthStore();
	// Removed favorites hooks - now handled by ArtistCardWithFavorites
	const navigate = useNavigate();

	// Helper function to chunk array into groups
	const chunkArray = <T,>(array: Array<T>, size: number): Array<Array<T>> => {
		const chunks: Array<Array<T>> = [];
		for (let index = 0; index < array.length; index += size) {
			chunks.push(array.slice(index, index + size));
		}
		return chunks;
	};

	const [place, setPlace] = useState("");
	const [type, setType] = useState("");
	const [category, setCategory] = useState("");
	const [genre, setGenre] = useState("");
	const [currentTestimonyIndex, setCurrentTestimonyIndex] = useState(0);
	const [searchInput, setSearchInput] = useState("");
	const debouncedSearchTerm = useDebounce(searchInput, 500);

	const [searchCity, setSearchCity] = useState("");
	const [cityPage, setCityPage] = useState(1);
	const [hasMoreCities, setHasMoreCities] = useState(true);

	const totalTestimonyCards = 3;

	const searchInputRef = useRef<HTMLInputElement>(null);

	console.log(place);

	const {
		cityOptions,
		categoryOptions,
		eventTypeOptions,
		musicalGenreOptions,
		isFetchingCities,
	} = useFilterLookup({
		cityPage,
		setCityPage,
		setHasMoreCities,
		hasMoreCities,
		cityPageSize: 20,
		searchCityByName: searchCity,
	});

	const { data: homePageImages } = useHomePageImages();
	const { data: userData } = useUser();

	// Build search filters based on dropdown selections
	const searchFilters = useMemo(() => {
		const filters: MusicalProductSearchRequest = {
			limite: 5,
			ordenarPorAvaliacao: true,
			tamanhoPagina: 4,
			pagina: 1,
			NomeOuDescricao: debouncedSearchTerm || undefined,
			// codigoMunicipio: 3550308, // São Paulo - SP as default
		};

		// Add city filter if selected
		if (place && place !== "") {
			filters.codigoMunicipio = parseInt(place);
		}

		// Add category filter if selected
		if (category && category !== "") {
			filters.categorias = [parseInt(category)];
		}

		// Add event type filter if selected
		if (type && type !== "") {
			filters.tiposEvento = [parseInt(type)];
		}

		// Add genre filter if selected
		if (genre && genre !== "") {
			filters.generosMusicais = [parseInt(genre)];
		}

		return filters;
	}, [debouncedSearchTerm, place, category, type, genre]);

	// Fetch featured bands from API with dynamic filters
	const { data: featuredBands, isLoading: bandsLoading } =
		useSearchMusicalProducts(
			searchFilters,
			true // Always fetch for homepage
		);

	// Clear all filters
	const clearAllFilters = () => {
		setPlace("");
		setCategory("");
		setType("");
		setGenre("");
	};

	// Check if any filters are applied
	const hasActiveFilters =
		place !== "" ||
		category !== "" ||
		type !== "" ||
		genre !== "" ||
		debouncedSearchTerm !== "";

	useEffect(() => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, []);

	return (
		<MainLayout>
			<div className="flex flex-col justify-start items-center py-3 gap-5">
				{/* search field */}
				<div className="flex flex-col xs:flex-row max-w-2xl w-full px-2 gap-2">
					<div className="w-full">
						<InputField
							ref={searchInputRef}
							icon={<Search size={20} />}
							placeholder="Busque profissionais da Música"
							value={searchInput}
							onChange={(event) => {
								setSearchInput(event.target.value);
							}}
							className="text-sm"
						/>
					</div>

					<Button
						className={`flex items-center gap-2 relative transition-all duration-200`}
						variant="outline"
						size="sm"
						onClick={async () => {
							await navigate({
								to: "/search",
								search: {
									...(place && { codigoMunicipio: place }),
									...(category && { categorias: [category] }),
									...(type && { tipos: [type] }),
									...(genre && { generos: [genre] }),
									...(debouncedSearchTerm && { q: debouncedSearchTerm }),
								},
							});
						}}
					>
						<SlidersHorizontal
							size={18}
							className="hover:text-white transition-all duration-200"
						/>
						<span>Avançados</span>
					</Button>
				</div>

				{/* Filters*/}
				<div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:flex sm:flex-row min-h-14 justify-center items-center gap-3 sm:gap-4 lg:gap-6 font-normal text-base px-4 max-w-9xl mx-auto">
					<div className="m-auto">
						<DropdownSelect
							icon={<MapPin size={18} />}
							id="place"
							label="Localização"
							options={cityOptions}
							selected={place}
							onChange={setPlace}
							searchTerm={searchCity}
							setSearchTerm={setSearchCity}
							onReachEnd={() => {
								if (!hasMoreCities || isFetchingCities) {
									return;
								}

								setCityPage((previous) => previous + 1);
							}}
							isLoading={isFetchingCities}
						/>
					</div>
					<div className="m-auto">
						<DropdownSelect
							id="categories"
							label="Categorias"
							options={categoryOptions}
							selected={category}
							onChange={setCategory}
						/>
					</div>
					<div className="m-auto">
						<DropdownSelect
							id="types"
							label="Tipo de Evento"
							options={eventTypeOptions}
							selected={type}
							onChange={setType}
						/>
					</div>
					<div className="m-auto">
						<DropdownSelect
							id="genres"
							label="Gênero Musical"
							options={musicalGenreOptions}
							selected={genre}
							onChange={setGenre}
						/>
					</div>
				</div>

				{/* Content */}
				<div className="w-full flex flex-col justify-center items-center gap-7">
					{/* Hero Image */}
					<div className="w-full max-w-9xl mx-auto">
						{!hasActiveFilters &&
						homePageImages &&
						homePageImages.length > 0 ? (
							<div className="relative w-full max-h-[394px] xl:rounded-lg">
								<div className="relative w-full h-full object-cover rounded-sm border">
									<LazyImage
										alt="Band gallery photo"
										className="w-full max-h-[394px] object-cover rounded-sm"
										src={homePageImages[0]?.Link ?? ""}
									/>
								</div>

								<div
									style={{
										background: `rgba(0, 0, 0, 0.25)`,
									}}
									className="absolute inset-0 overflow-hidden"
								/>

								{!userData && (
									<Link to="/welcome" className="w-full">
										<Button
											variant="secondary"
											className="absolute top-1/2 left-1/2 w-[80%] md:w-[50%] lg:w-[30%] h-[60px] bg-white -translate-x-1/2 -translate-y-1/2 border-gray-300 text-gray-700"
										>
											Cadastre-se
										</Button>
									</Link>
								)}
							</div>
						) : (
							<>
								{!hasActiveFilters && (
									<div className="animate-pulse w-full h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[28rem] max-w-9xl">
										<div className="bg-gray-300 h-full xl:rounded-lg w-full"></div>
									</div>
								)}
							</>
						)}
					</div>
					{/* Best Rated */}
					<div className="w-full flex flex-col justify-center items-center py-8 px-4 sm:px-8 lg:px-12 xl:px-16 gap-7 max-w-9xl mx-auto">
						<div className="flex w-full justify-between items-center flex-col sm:flex-row gap-4 sm:gap-0">
							<h1 className="font-bold text-xl sm:text-2xl lg:text-3xl text-center sm:text-left">
								{hasActiveFilters ? "Artistas Filtrados" : "Melhores Avaliados"}
							</h1>
							<Link
								to="/search"
								search={{
									...(place && { codigoMunicipio: place }),
									...(category && { categorias: [category] }),
									...(type && { tipos: [type] }),
									...(genre && { generos: [genre] }),
									...(debouncedSearchTerm && { q: debouncedSearchTerm }),
								}}
							>
								<Button variant="transparent" className="shrink-0">
									<div className="flex justify-center items-center gap-2 px-4">
										<span className="font-semibold text-primary-700 text-base sm:text-lg whitespace-nowrap">
											Ver Todos
										</span>
										<ArrowRight className="text-primary-700" size={18} />
									</div>
								</Button>
							</Link>
						</div>
						<div className="w-full">
							{bandsLoading ? (
								// Loading skeletons
								<>
									{/* Mobile to Large: Horizontal scroll */}
									<div className="flex gap-4 overflow-x-auto pb-4 xl:hidden">
										{Array.from({ length: 5 }).map((_, index) => (
											<div
												key={`skeleton-mobile-${index}`}
												className="flex-none w-64"
											>
												<div className="animate-pulse">
													<div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
													<div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
													<div className="bg-gray-300 h-4 rounded w-1/2"></div>
												</div>
											</div>
										))}
									</div>
									{/* Extra Large: Grid layout with 5 columns */}
									<div className="hidden xl:grid xl:grid-cols-5 gap-4 2xl:gap-6 max-w-7xl mx-auto">
										{Array.from({ length: 5 }).map((_, index) => (
											<div key={`skeleton-desktop-${index}`} className="w-full">
												<div className="animate-pulse">
													<div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
													<div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
													<div className="bg-gray-300 h-4 rounded w-1/2"></div>
												</div>
											</div>
										))}
									</div>
								</>
							) : (featuredBands?.dados?.length ?? 0) > 0 ? (
								// Real API data
								<>
									{/* Mobile to Large: Horizontal scroll */}
									<div className="flex gap-4 overflow-x-auto pb-4 xl:hidden">
										{(featuredBands?.dados ?? []).map((band) => (
											<div key={`mobile-${band.id}`} className="flex-none w-64">
												<ArtistCardWithFavorites
													product={band}
													onProfileClick={() =>
														navigate({
															to: "/band/profile/$id",
															params: { id: band.id.toString() },
														})
													}
												/>
											</div>
										))}
									</div>
									{/* Extra Large: Grid layout with 4 columns */}
									<div className="hidden xl:grid xl:grid-cols-4 gap-4 2xl:gap-6 max-w-7xl mx-auto">
										{(featuredBands?.dados ?? []).map((band) => (
											<div key={`desktop-${band.id}`} className="w-full">
												<ArtistCardWithFavorites
													product={band}
													onProfileClick={() =>
														navigate({
															to: "/band/profile/$id",
															params: { id: band.id.toString() },
														})
													}
												/>
											</div>
										))}
									</div>
								</>
							) : (
								// No bands available message
								<div className="flex flex-col items-center justify-center py-16 text-center">
									<div className="text-gray-400 text-lg mb-2">🎵</div>
									<h3 className="text-lg font-semibold text-gray-700 mb-2">
										{hasActiveFilters
											? "Nenhuma banda encontrada com os filtros aplicados"
											: "Nenhuma banda encontrada"}
									</h3>
									<p className="text-gray-500 max-w-md">
										{hasActiveFilters
											? "Tente ajustar os filtros para encontrar mais opções ou limpe os filtros para ver todas as bandas."
											: "Não conseguimos carregar as bandas no momento. Tente novamente mais tarde."}
									</p>
									{hasActiveFilters && (
										<Button
											onClick={clearAllFilters}
											className="mt-4 bg-primary-600 hover:bg-blue-700 text-white"
										>
											Limpar Filtros
										</Button>
									)}
								</div>
							)}
						</div>
					</div>
					{/* Highlights */}
					<div className="w-full flex flex-col justify-center items-center py-8 px-4 sm:px-8 lg:px-12 xl:px-16 gap-7 max-w-9xl mx-auto">
						<div className="flex w-full justify-start">
							<h1 className="font-bold text-xl sm:text-2xl lg:text-3xl">
								Destaques
							</h1>
						</div>

						{/* Mobile to Large: Responsive flex layout */}
						<div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full xl:hidden">
							{promos.map((promo, index) => (
								<div key={index} className="w-full sm:w-80 lg:w-72">
									<PromoCard
										description={promo.description}
										title={promo.title}
										imgSrc={promo.imgSrc}
									/>
								</div>
							))}
						</div>

						{/* Extra Large: Grid layout with 5 columns */}
						<div className="hidden xl:grid xl:grid-cols-5 gap-4 2xl:gap-6 w-full max-w-7xl mx-auto">
							{promos.map((promo, index) => (
								<div key={index} className="w-full">
									<PromoCard
										description={promo.description}
										title={promo.title}
										imgSrc={promo.imgSrc}
									/>
								</div>
							))}
						</div>
					</div>
					{/* Categories */}
					<div className="w-full flex flex-col justify-center items-center py-8 gap-7 bg-primary-50/60 px-4">
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
							Categorias
						</h1>
						<div className="w-full flex flex-col items-center gap-4">
							{/* Mobile: 2 columns */}
							<div className="grid grid-cols-2 gap-3 w-full sm:hidden">
								{categoryOptions.map((category) => (
									<Link
										key={category.value}
										to="/search"
										search={{ categorias: [category.value] }}
										className="font-medium text-sm text-gray-900 hover:text-primary-600 transition-colors text-center p-3 
										rounded-lg hover:bg-white/50 border border-gray-200 hover:border-primary-500"
									>
										{category.label}
									</Link>
								))}
							</div>

							{/* Tablet: 3 columns per row */}
							<div className="hidden sm:flex md:hidden flex-col items-center gap-4 w-full">
								{chunkArray(categoryOptions, 3).map((row, rowIndex) => (
									<div
										key={rowIndex}
										className="flex justify-center gap-4 w-full"
									>
										{row.map((category) => (
											<Link
												key={category.value}
												to="/search"
												search={{ categorias: [category.value.toString()] }}
												className="font-medium text-base text-gray-900 hover:text-primary-600 transition-colors text-center p-3 rounded-lg hover:bg-primary-50 w-fit min-w-0 flex-1 max-w-xs"
											>
												{category.label}
											</Link>
										))}
									</div>
								))}
							</div>

							{/* Desktop: 5 columns per row */}
							<div className="hidden md:flex flex-col items-center gap-4 w-full">
								{chunkArray(categoryOptions, 5).map((row, rowIndex) => (
									<div
										key={rowIndex}
										className="flex justify-center gap-4 lg:gap-6 w-full"
									>
										{row.map((category) => (
											<Link
												key={category.value}
												to="/search"
												search={{ categorias: [category.value.toString()] }}
												className="font-medium text-base lg:text-lg text-primary-800 transition-colors text-center p-3 rounded-lg hover:bg-primary-50 hover:border-primary-300 w-fit"
											>
												{category.label}
											</Link>
										))}
									</div>
								))}
							</div>
						</div>
						<Link
							to="/search"
							className="text-primary-500 text-lg font-medium hover:underline flex gap-3 align-center justify-center w-full"
						>
							Ver Todos
							<ArrowRight className="rounded-full border-2 border-solid border-current h-[26px] w-[26px]" />
						</Link>
					</div>{" "}
					{/* Navigate By */}
					<div className="w-full flex flex-col justify-center items-center gap-7 py-8 px-4 max-w-9xl mx-auto">
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
							Navegue por:
						</h1>
						<div className="w-full flex flex-col items-center gap-4">
							{/* Mobile: 2 columns */}
							<div className="grid grid-cols-2 gap-3 w-full sm:hidden">
								{eventTypeOptions.map((eventType) => (
									<Link
										key={eventType.value}
										to="/search"
										search={{ tipos: [eventType.value.toString()] }}
										className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center border border-primary-200 bg-primary-50/30"
									>
										<span className="text-sm font-medium leading-tight">
											{eventType.label}
										</span>
									</Link>
								))}
							</div>

							{/* Tablet: 3 columns per row */}
							<div className="hidden sm:flex md:hidden flex-col items-center gap-4 w-full">
								{chunkArray(eventTypeOptions, 3).map((row, rowIndex) => (
									<div
										key={rowIndex}
										className="flex justify-center gap-4 w-full"
									>
										{row.map((eventType) => (
											<Link
												key={eventType.value}
												to="/search"
												search={{ tipos: [eventType.value.toString()] }}
												className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center w-fit min-w-0 flex-1 max-w-xs"
											>
												<span className="text-base font-medium leading-tight">
													{eventType.label}
												</span>
											</Link>
										))}
									</div>
								))}
							</div>

							{/* Desktop: 5 columns per row */}
							<div className="hidden md:flex flex-col items-center gap-4 w-full">
								{chunkArray(eventTypeOptions, 5).map((row, rowIndex) => (
									<div
										key={rowIndex}
										className="flex justify-center gap-4 lg:gap-6 w-full"
									>
										{row.map((eventType) => (
											<Link
												key={eventType.value}
												to="/search"
												search={{ tipos: [eventType.value.toString()] }}
												className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center w-fit"
											>
												<span className="text-base lg:text-lg font-medium leading-tight">
													{eventType.label}
												</span>
											</Link>
										))}
									</div>
								))}
							</div>
						</div>
					</div>
					{/* Gêneros Musicais */}
					<div className="w-full flex flex-col justify-center items-center gap-7 py-8 px-4 max-w-9xl mx-auto">
						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
							Gêneros Musicais
						</h1>
						<div className="w-full flex flex-col items-center gap-4">
							{/* Mobile: 2 columns */}
							<div className="grid grid-cols-2 gap-3 w-full sm:hidden">
								{musicalGenreOptions.map((genre) => (
									<Link
										key={genre.value}
										to="/search"
										search={{ generos: [genre.value.toString()] }}
										className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center border border-primary-200 bg-primary-50/30"
									>
										<span className="text-sm font-medium leading-tight">
											{genre.label}
										</span>
									</Link>
								))}
							</div>

							{/* Tablet: 3 columns per row */}
							<div className="hidden sm:flex md:hidden flex-col items-center gap-4 w-full">
								{chunkArray(musicalGenreOptions, 3).map((row, rowIndex) => (
									<div
										key={rowIndex}
										className="flex justify-center gap-4 w-full"
									>
										{row.map((genre) => (
											<Link
												key={genre.value}
												to="/search"
												search={{ generos: [genre.value.toString()] }}
												className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center w-fit min-w-0 flex-1 max-w-xs"
											>
												<span className="text-base font-medium leading-tight">
													{genre.label}
												</span>
											</Link>
										))}
									</div>
								))}
							</div>

							{/* Desktop: 5 columns per row */}
							<div className="hidden md:flex flex-col items-center gap-4 w-full">
								{chunkArray(musicalGenreOptions, 5).map((row, rowIndex) => (
									<div
										key={rowIndex}
										className="flex justify-center gap-4 lg:gap-6 w-full"
									>
										{row.map((genre) => (
											<Link
												key={genre.value}
												to="/search"
												search={{ generos: [genre.value.toString()] }}
												className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center w-fit"
											>
												<span className="text-base lg:text-lg font-medium leading-tight">
													{genre.label}
												</span>
											</Link>
										))}
									</div>
								))}
							</div>
						</div>
					</div>
					{/* Testimonials */}
					<div className="relative w-full flex flex-col justify-center items-center gap-7 py-8 px-4 max-w-9xl mx-auto">
						<div className="flex flex-col justify-center items-center gap-5 w-full max-w-2xl text-center">
							<h1 className="font-semibold text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-gray-900">
								O que nossos usuários estão dizendo:
							</h1>
							<p className="text-gray-500 text-sm sm:text-base lg:text-lg font-normal">
								Experiências compartilhadas por quem confiou em nossa plataforma
							</p>
						</div>

						{/* Carousel */}
						<div className="relative w-full overflow-hidden">
							{/* Mobile to Large: Single card carousel */}
							<div className="xl:hidden">
								<div
									className="flex transition-transform duration-300 ease-in-out"
									style={{
										transform: `translateX(-${currentTestimonyIndex * 100}%)`,
									}}
								>
									{Array.from({ length: totalTestimonyCards }).map(
										(_, index) => (
											<div key={index} className="w-full flex-shrink-0">
												<div className="w-full mx-auto">
													<TestimonialCard
														hired="Banda Contratada"
														name="Cliente Satisfeito"
														numberOfStars={5}
													/>
												</div>
											</div>
										)
									)}
								</div>
							</div>
							{/* Extra Large: Grid layout with 3 columns */}
							<div className="hidden xl:grid xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
								{Array.from({ length: totalTestimonyCards }).map((_, index) => (
									<TestimonialCard
										key={index}
										hired="Banda Contratada"
										name="Cliente Satisfeito"
										numberOfStars={5}
									/>
								))}
							</div>
						</div>

						{/* Navigation - show up to large screens */}
						<div className="flex items-center justify-center gap-3 text-gray-500 xl:hidden">
							<button
								className="rounded-full shadow-md bg-white w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
								disabled={currentTestimonyIndex === 0}
								onClick={() => {
									setCurrentTestimonyIndex((previous) =>
										Math.max(previous - 1, 0)
									);
								}}
							>
								<ArrowLeft size={16} />
							</button>
							<div className="flex gap-2">
								{Array.from({ length: totalTestimonyCards }).map((_, index) => (
									<div
										key={index}
										className={`w-2 h-2 rounded-full transition-colors ${
											index === currentTestimonyIndex
												? "bg-primary-600"
												: "bg-gray-300"
										}`}
									/>
								))}
							</div>
							<button
								className="rounded-full shadow-md bg-white w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
								disabled={currentTestimonyIndex === totalTestimonyCards - 1}
								onClick={() => {
									setCurrentTestimonyIndex((previous) =>
										Math.min(previous + 1, totalTestimonyCards - 1)
									);
								}}
							>
								<ArrowRight size={16} />
							</button>
						</div>
					</div>
					{/* FAQ questions */}
					<div className="relative flex flex-col items-center w-full px-4 sm:px-8 py-8 max-w-9xl mx-auto">
						<div className="flex flex-col justify-center items-center text-center w-full gap-6 mb-8">
							<h1 className="font-semibold text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-gray-900">
								Dúvidas Frequentes
							</h1>
							<p className="text-gray-500 text-sm sm:text-base lg:text-lg max-w-2xl">
								Encontre respostas para as perguntas mais comuns sobre o uso da
								nossa plataforma
							</p>
						</div>

						<div className="w-full">
							<FAQAccordion items={faqData} />
						</div>
					</div>
					<footer className="bg-[#FCFCFD] w-full flex flex-col justify-center items-center px-4 sm:px-8 border border-solid border-gray-200 pt-12 pb-8">
						<div className="w-full max-w-9xl mx-auto flex flex-col gap-8">
							<div className="flex justify-center sm:justify-start">
								<VibrattoLogo />
							</div>
							<div className="flex justify-center sm:justify-start items-center gap-4 sm:gap-6 lg:gap-8 text-gray-500 font-medium text-sm sm:text-base flex-wrap">
								<a className="hover:underline transition-colors" href="#">
									Voltar ao topo
								</a>
								{!isAuthenticated && (
									<>
										<a
											className="hover:underline transition-colors"
											href="/register"
										>
											Cadastrar-se
										</a>
										<a
											className="hover:underline transition-colors"
											href="/login"
										>
											Entrar
										</a>
									</>
								)}
							</div>

							<hr className="w-full border-gray-200" />

							<div className="flex w-full items-center justify-between flex-col sm:flex-row gap-4">
								<p className="text-gray-400 text-sm sm:text-base">
									© 2025 Vibratto - Projeto Atual 20260513
								</p>
								<div className="flex gap-4 items-center justify-center">
									<a
										href="#"
										className="text-gray-400 hover:text-gray-600 transition-colors"
									>
										<Instagram size={20} />
									</a>
									<a
										href="#"
										className="text-gray-400 hover:text-gray-600 transition-colors"
									>
										<Facebook size={20} />
									</a>
								</div>
							</div>
						</div>
					</footer>
				</div>
			</div>
		</MainLayout>
	);
};

// import { useState, useMemo, useEffect, useRef } from "react";
// import { Link, useNavigate } from "@tanstack/react-router";
// import {
// 	ArrowLeft,
// 	ArrowRight,
// 	Facebook,
// 	SlidersHorizontal,
// 	Instagram,
// 	MapPin,
// 	Search,
// } from "lucide-react";

// import { LazyImage } from "../components/ui/LazyImage/LazyImage";

// import type { FunctionComponent } from "../common/types";
// import { MainLayout } from "../components/layout/MainLayout";
// import { Button } from "../components/ui/Button/Button";
// import { ArtistCardWithFavorites } from "../components/cards/ArtistCard/ArtistCardWithFavorites";
// import { PromoCard } from "../components/cards/PromoCard/PromoCard";
// import { TestimonialCard } from "../components/cards/TestimonialCard/TestimonialCard";
// import { FAQAccordion } from "../components/cards/FAQAccordion/FAQAccordion";
// import { VibrattoLogo } from "../components/VibrattoLogo/VibrattoLogo";
// import { useAuthStore } from "../store/authStore";
// // Removed imports that are now handled by ArtistCardWithFavorites
// import { useHomePageImages } from "../hooks/useFilters";
// import { useSearchMusicalProducts } from "../hooks/useMusicalProducts";
// import type { MusicalProductSearchRequest } from "@/api/types";
// import { useUser } from "@/hooks/useUser";
// import { InputField } from "@/components/forms/InputField/InputField";
// import { useDebounce } from "@/hooks/useDebounceSimple";
// import type { Option } from "@/components/forms/Select/Select";
// import { Select } from "@/components/forms/Select/Select";
// import { useFilterLookup } from "@/domains/MusicalProfile/hooks/useFilterLookup";

// const promos = [
// 	{
// 		title: "Encontre a opção perfeita para o seu evento",
// 		description: "Escolha entre bandas, trios e muitas mais!",
// 		imgSrc: undefined,
// 	},
// 	{
// 		title: "Transforme seu evento com os melhores profissionais",
// 		description: "Produtores, roadies e muito mais à sua disposição.",
// 		imgSrc: undefined,
// 	},
// 	{
// 		title: "Para todas as ocasiões:",
// 		description: "Casamentos, bares, formaturas e muito mais",
// 		imgSrc: undefined, // This will show the placeholder
// 	},
// 	{
// 		title: "Para todas as ocasiões:",
// 		description: "Casamentos, bares, formaturas e muito mais",
// 		imgSrc: undefined,
// 	},
// 	{
// 		title: "Para todas as ocasiões:",
// 		description: "Casamentos, bares, formaturas e muito mais",
// 		imgSrc: undefined, // This will show the placeholder
// 	},
// ];

// const faqData = [
// 	{
// 		question: "O que é Lorem Ipsum?",
// 		answer:
// 			"Lorem Ipsum é simplesmente uma simulação de texto da indústria tipográfica.",
// 	},
// 	{
// 		question: "Por que usamos isso?",
// 		answer:
// 			"É um fato conhecido de que um leitor se distrairá com o conteúdo legível.",
// 	},
// 	{
// 		question: "De onde vem?",
// 		answer:
// 			"Contrary to popular belief, Lorem Ipsum não é simplesmente texto aleatório.",
// 	},
// ];

// export const Home = (): FunctionComponent => {
// 	const { isAuthenticated } = useAuthStore();
// 	// Removed favorites hooks - now handled by ArtistCardWithFavorites
// 	const navigate = useNavigate();

// 	// Helper function to chunk array into groups
// 	const chunkArray = <T,>(array: Array<T>, size: number): Array<Array<T>> => {
// 		const chunks: Array<Array<T>> = [];
// 		for (let index = 0; index < array.length; index += size) {
// 			chunks.push(array.slice(index, index + size));
// 		}
// 		return chunks;
// 	};

// 	const [place, setPlace] = useState("");
// 	const [type, setType] = useState("");
// 	const [category, setCategory] = useState("");
// 	const [genre, setGenre] = useState("");
// 	const [currentTestimonyIndex, setCurrentTestimonyIndex] = useState(0);
// 	const [searchInput, setSearchInput] = useState("");
// 	const debouncedSearchTerm = useDebounce(searchInput, 500);

// 	const [selectedCities, setSelectedCities] = useState<Array<Option>>([]);
// 	const [selectedCategories, setSelectedCategories] = useState<Array<Option>>(
// 		[]
// 	);
// 	const [selectedGenres, setSelectedGenres] = useState<Array<Option>>([]);
// 	const [selectedEventTypes, setSelectedEventTypes] = useState<Array<Option>>(
// 		[]
// 	);

// 	const [searchCity, setSearchCity] = useState("");
// 	const [cityPage, setCityPage] = useState(1);
// 	const [hasMoreCities, setHasMoreCities] = useState(true);

// 	const totalTestimonyCards = 3;

// 	const searchInputRef = useRef<HTMLInputElement>(null);

// 	const {
// 		cityOptions,
// 		categoryOptions,
// 		eventTypeOptions,
// 		musicalGenreOptions,
// 		isLoadingCities,
// 		isLoadingCategories,
// 		isLoadingEventTypes,
// 		isLoadingGenresMusical,
// 		isFetchingCities,
// 	} = useFilterLookup({
// 		cityPage,
// 		setCityPage,
// 		setHasMoreCities,
// 		hasMoreCities,
// 		cityPageSize: 20,
// 		searchCityByName: searchCity,
// 	});

// 	const { data: homePageImages } = useHomePageImages();
// 	const { data: userData } = useUser();

// 	// Build search filters based on dropdown selections
// 	const searchFilters = useMemo(() => {
// 		const filters: MusicalProductSearchRequest = {
// 			limite: 5,
// 			ordenarPorAvaliacao: true,
// 			tamanhoPagina: 4,
// 			pagina: 1,
// 			NomeOuDescricao: debouncedSearchTerm || undefined,
// 			// codigoMunicipio: 3550308, // São Paulo - SP as default
// 		};

// 		// Add city filter if selected
// 		if (place && place !== "") {
// 			filters.codigoMunicipio = parseInt(place);
// 		}

// 		// Add category filter if selected
// 		if (category && category !== "") {
// 			filters.categorias = [parseInt(category)];
// 		}

// 		// Add event type filter if selected
// 		if (type && type !== "") {
// 			filters.tiposEvento = [parseInt(type)];
// 		}

// 		// Add genre filter if selected
// 		if (genre && genre !== "") {
// 			filters.generosMusicais = [parseInt(genre)];
// 		}

// 		return filters;
// 	}, [debouncedSearchTerm, place, category, type, genre]);

// 	// Fetch featured bands from API with dynamic filters
// 	const { data: featuredBands, isLoading: bandsLoading } =
// 		useSearchMusicalProducts(
// 			searchFilters,
// 			true // Always fetch for homepage
// 		);

// 	// Removed handleFavoriteToggle - now handled by ArtistCardWithFavorites

// 	// Clear all filters
// 	const clearAllFilters = () => {
// 		setPlace("");
// 		setCategory("");
// 		setType("");
// 		setGenre("");

// 		setSelectedCities([]);
// 		setSelectedCategories([]);
// 		setSelectedEventTypes([]);
// 		setSelectedGenres([]);
// 	};

// 	// Check if any filters are applied
// 	const hasActiveFilters =
// 		place !== "" ||
// 		category !== "" ||
// 		type !== "" ||
// 		genre !== "" ||
// 		debouncedSearchTerm !== "";

// 	useEffect(() => {
// 		if (searchInputRef.current) {
// 			searchInputRef.current.focus();
// 		}
// 	}, []);

// 	return (
// 		<MainLayout>
// 			<div className="flex flex-col justify-start items-center py-3 gap-5">
// 				{/* search field */}
// 				<div className="flex flex-col xs:flex-row max-w-2xl w-full px-2 gap-2">
// 					<div className="w-full">
// 						<InputField
// 							ref={searchInputRef}
// 							icon={<Search size={20} />}
// 							placeholder="Busque profissionais da Música"
// 							value={searchInput}
// 							onChange={(event) => {
// 								setSearchInput(event.target.value);
// 							}}
// 							className="text-sm"
// 						/>
// 					</div>

// 					<Button
// 						className={`flex items-center gap-2 relative transition-all duration-200`}
// 						variant="outline"
// 						size="sm"
// 						onClick={async () => {
// 							await navigate({
// 								to: "/search",
// 								search: {
// 									...(place && { codigoMunicipio: place }),
// 									...(category && { categorias: [category] }),
// 									...(type && { tipos: [type] }),
// 									...(genre && { generos: [genre] }),
// 									...(debouncedSearchTerm && { q: debouncedSearchTerm }),
// 								},
// 							});
// 						}}
// 					>
// 						<SlidersHorizontal
// 							size={18}
// 							className="hover:text-white transition-all duration-200"
// 						/>
// 						<span>Avançados</span>
// 					</Button>
// 				</div>

// 				{/* Filters*/}
// 				<div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:flex sm:flex-row min-h-14 justify-center items-center gap-3 sm:gap-4 lg:gap-6 font-normal text-base px-4 max-w-9xl mx-auto">
// 					<div className="m-auto">
// 						<Select
// 							icon={<MapPin size={18} />}
// 							label="Localização"
// 							name="Localizacao"
// 							options={cityOptions}
// 							placeholder={
// 								isLoadingCities ? "Carregando..." : "Filtrar pela localização"
// 							}
// 							selectedOptions={selectedCities}
// 							setSelectedOptions={(options) => {
// 								const value = options.find((item) => item);

// 								setPlace(value?.value ? value.value : "");
// 								setSelectedCities(options);
// 							}}
// 							searchTerm={searchCity}
// 							setSearchTerm={setSearchCity}
// 							onReachEnd={() => {
// 								if (!hasMoreCities || isFetchingCities) {
// 									return;
// 								}

// 								setCityPage((previous) => previous + 1);
// 							}}
// 							isLoading={isFetchingCities}
// 						/>
// 					</div>
// 					<div className="m-auto">
// 						<Select
// 							label="Categoria"
// 							name="categorias"
// 							placeholder={
// 								isLoadingCategories ? "Carregando..." : "Filtrar por categoria"
// 							}
// 							options={categoryOptions}
// 							selectedOptions={selectedCategories}
// 							setSelectedOptions={(options) => {
// 								const value = options.find((item) => item);

// 								setCategory(value?.value ? value.value : "");
// 								setSelectedCategories(options);
// 							}}
// 						/>
// 					</div>
// 					<div className="m-auto">
// 						<Select
// 							label="Tipo de Evento"
// 							name="tipos-evento"
// 							placeholder={
// 								isLoadingEventTypes
// 									? "Carregando..."
// 									: "Filtrar por tipo de evento"
// 							}
// 							options={eventTypeOptions}
// 							selectedOptions={selectedEventTypes}
// 							setSelectedOptions={(options) => {
// 								const value = options.find((item) => item);

// 								setType(value?.value ? value.value : "");
// 								setSelectedEventTypes(options);
// 							}}
// 						/>
// 					</div>
// 					<div className="m-auto">
// 						<Select
// 							label="Gênero Musical"
// 							name="generos"
// 							placeholder={
// 								isLoadingGenresMusical
// 									? "Carregando..."
// 									: "Filtrar por gênero musical"
// 							}
// 							options={musicalGenreOptions}
// 							selectedOptions={selectedGenres}
// 							setSelectedOptions={(options) => {
// 								const value = options.find((item) => item);

// 								setGenre(value?.value ? value.value : "");
// 								setSelectedGenres(options);
// 							}}
// 						/>
// 					</div>
// 				</div>

// 				{/* Content */}
// 				<div className="w-full flex flex-col justify-center items-center gap-7">
// 					{/* Hero Image */}
// 					<div className="w-full max-w-9xl mx-auto">
// 						{!hasActiveFilters &&
// 						homePageImages &&
// 						homePageImages.length > 0 ? (
// 							<div className="relative w-full max-h-[394px] xl:rounded-lg">
// 								<div className="relative w-full h-full object-cover rounded-sm border">
// 									<LazyImage
// 										alt="Band gallery photo"
// 										className="w-full max-h-[394px] object-cover rounded-sm"
// 										src={homePageImages[0]?.Link ?? ""}
// 									/>
// 								</div>

// 								<div
// 									style={{
// 										background: `rgba(0, 0, 0, 0.25)`,
// 									}}
// 									className="absolute inset-0 overflow-hidden"
// 								/>

// 								{!userData && (
// 									<Link to="/welcome" className="w-full">
// 										<Button
// 											variant="secondary"
// 											className="absolute top-1/2 left-1/2 w-[80%] md:w-[50%] lg:w-[30%] h-[60px] bg-white -translate-x-1/2 -translate-y-1/2 border-gray-300 text-gray-700"
// 										>
// 											Cadastre-se
// 										</Button>
// 									</Link>
// 								)}
// 							</div>
// 						) : (
// 							<>
// 								{!hasActiveFilters && (
// 									<div className="animate-pulse w-full h-48 sm:h-64 md:h-80 lg:h-96 xl:h-[28rem] max-w-9xl">
// 										<div className="bg-gray-300 h-full xl:rounded-lg w-full"></div>
// 									</div>
// 								)}
// 							</>
// 						)}
// 					</div>
// 					{/* Best Rated */}
// 					<div className="w-full flex flex-col justify-center items-center py-8 px-4 sm:px-8 lg:px-12 xl:px-16 gap-7 max-w-9xl mx-auto">
// 						<div className="flex w-full justify-between items-center flex-col sm:flex-row gap-4 sm:gap-0">
// 							<h1 className="font-bold text-xl sm:text-2xl lg:text-3xl text-center sm:text-left">
// 								{hasActiveFilters ? "Artistas Filtrados" : "Melhores Avaliados"}
// 							</h1>
// 							<Link
// 								to="/search"
// 								search={{
// 									...(place && { codigoMunicipio: place }),
// 									...(category && { categorias: [category] }),
// 									...(type && { tipos: [type] }),
// 									...(genre && { generos: [genre] }),
// 									...(debouncedSearchTerm && { q: debouncedSearchTerm }),
// 								}}
// 							>
// 								<Button variant="transparent" className="shrink-0">
// 									<div className="flex justify-center items-center gap-2 px-4">
// 										<span className="font-semibold text-primary-700 text-base sm:text-lg whitespace-nowrap">
// 											Ver Todos
// 										</span>
// 										<ArrowRight className="text-primary-700" size={18} />
// 									</div>
// 								</Button>
// 							</Link>
// 						</div>
// 						<div className="w-full">
// 							{bandsLoading ? (
// 								// Loading skeletons
// 								<>
// 									{/* Mobile to Large: Horizontal scroll */}
// 									<div className="flex gap-4 overflow-x-auto pb-4 xl:hidden">
// 										{Array.from({ length: 5 }).map((_, index) => (
// 											<div
// 												key={`skeleton-mobile-${index}`}
// 												className="flex-none w-64"
// 											>
// 												<div className="animate-pulse">
// 													<div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
// 													<div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
// 													<div className="bg-gray-300 h-4 rounded w-1/2"></div>
// 												</div>
// 											</div>
// 										))}
// 									</div>
// 									{/* Extra Large: Grid layout with 5 columns */}
// 									<div className="hidden xl:grid xl:grid-cols-5 gap-4 2xl:gap-6 max-w-7xl mx-auto">
// 										{Array.from({ length: 5 }).map((_, index) => (
// 											<div key={`skeleton-desktop-${index}`} className="w-full">
// 												<div className="animate-pulse">
// 													<div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
// 													<div className="bg-gray-300 h-4 rounded w-3/4 mb-2"></div>
// 													<div className="bg-gray-300 h-4 rounded w-1/2"></div>
// 												</div>
// 											</div>
// 										))}
// 									</div>
// 								</>
// 							) : (featuredBands?.dados?.length ?? 0) > 0 ? (
// 								// Real API data
// 								<>
// 									{/* Mobile to Large: Horizontal scroll */}
// 									<div className="flex gap-4 overflow-x-auto pb-4 xl:hidden">
// 										{(featuredBands?.dados ?? []).map((band) => (
// 											<div key={`mobile-${band.id}`} className="flex-none w-64">
// 												<ArtistCardWithFavorites
// 													product={band}
// 													onProfileClick={() =>
// 														navigate({
// 															to: "/band/profile/$id",
// 															params: { id: band.id.toString() },
// 														})
// 													}
// 												/>
// 											</div>
// 										))}
// 									</div>
// 									{/* Extra Large: Grid layout with 4 columns */}
// 									<div className="hidden xl:grid xl:grid-cols-4 gap-4 2xl:gap-6 max-w-7xl mx-auto">
// 										{(featuredBands?.dados ?? []).map((band) => (
// 											<div key={`desktop-${band.id}`} className="w-full">
// 												<ArtistCardWithFavorites
// 													product={band}
// 													onProfileClick={() =>
// 														navigate({
// 															to: "/band/profile/$id",
// 															params: { id: band.id.toString() },
// 														})
// 													}
// 												/>
// 											</div>
// 										))}
// 									</div>
// 								</>
// 							) : (
// 								// No bands available message
// 								<div className="flex flex-col items-center justify-center py-16 text-center">
// 									<div className="text-gray-400 text-lg mb-2">🎵</div>
// 									<h3 className="text-lg font-semibold text-gray-700 mb-2">
// 										{hasActiveFilters
// 											? "Nenhuma banda encontrada com os filtros aplicados"
// 											: "Nenhuma banda encontrada"}
// 									</h3>
// 									<p className="text-gray-500 max-w-md">
// 										{hasActiveFilters
// 											? "Tente ajustar os filtros para encontrar mais opções ou limpe os filtros para ver todas as bandas."
// 											: "Não conseguimos carregar as bandas no momento. Tente novamente mais tarde."}
// 									</p>
// 									{hasActiveFilters && (
// 										<Button
// 											onClick={clearAllFilters}
// 											className="mt-4 bg-primary-600 hover:bg-blue-700 text-white"
// 										>
// 											Limpar Filtros
// 										</Button>
// 									)}
// 								</div>
// 							)}
// 						</div>
// 					</div>
// 					{/* Highlights */}
// 					<div className="w-full flex flex-col justify-center items-center py-8 px-4 sm:px-8 lg:px-12 xl:px-16 gap-7 max-w-9xl mx-auto">
// 						<div className="flex w-full justify-start">
// 							<h1 className="font-bold text-xl sm:text-2xl lg:text-3xl">
// 								Destaques
// 							</h1>
// 						</div>

// 						{/* Mobile to Large: Responsive flex layout */}
// 						<div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full xl:hidden">
// 							{promos.map((promo, index) => (
// 								<div key={index} className="w-full sm:w-80 lg:w-72">
// 									<PromoCard
// 										description={promo.description}
// 										title={promo.title}
// 										imgSrc={promo.imgSrc}
// 									/>
// 								</div>
// 							))}
// 						</div>

// 						{/* Extra Large: Grid layout with 5 columns */}
// 						<div className="hidden xl:grid xl:grid-cols-5 gap-4 2xl:gap-6 w-full max-w-7xl mx-auto">
// 							{promos.map((promo, index) => (
// 								<div key={index} className="w-full">
// 									<PromoCard
// 										description={promo.description}
// 										title={promo.title}
// 										imgSrc={promo.imgSrc}
// 									/>
// 								</div>
// 							))}
// 						</div>
// 					</div>
// 					{/* Categories */}
// 					<div className="w-full flex flex-col justify-center items-center py-8 gap-7 bg-primary-50/60 px-4">
// 						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
// 							Categorias
// 						</h1>
// 						<div className="w-full flex flex-col items-center gap-4">
// 							{/* Mobile: 2 columns */}
// 							<div className="grid grid-cols-2 gap-3 w-full sm:hidden">
// 								{(categoryOptions || []).map((category) => (
// 									<Link
// 										key={category.value}
// 										to="/search"
// 										search={{ categorias: [category.value] }}
// 										className="font-medium text-sm text-gray-900 hover:text-primary-600 transition-colors text-center p-3
// 										rounded-lg hover:bg-white/50 border border-gray-200 hover:border-primary-500"
// 									>
// 										{category.label}
// 									</Link>
// 								))}
// 							</div>

// 							{/* Tablet: 3 columns per row */}
// 							<div className="hidden sm:flex md:hidden flex-col items-center gap-4 w-full">
// 								{chunkArray(categoryOptions, 3).map((row, rowIndex) => (
// 									<div
// 										key={rowIndex}
// 										className="flex justify-center gap-4 w-full"
// 									>
// 										{row.map((category) => (
// 											<Link
// 												key={category.value}
// 												to="/search"
// 												search={{ categorias: [category.value] }}
// 												className="font-medium text-sm text-gray-900 hover:text-primary-600 transition-colors text-center p-3
// 										rounded-lg hover:bg-white/50 border border-gray-200 hover:border-primary-500"
// 											>
// 												{category.label}
// 											</Link>
// 										))}
// 									</div>
// 								))}
// 							</div>

// 							{/* Desktop: 5 columns per row */}
// 							<div className="hidden md:flex flex-col items-center gap-4 w-full">
// 								{chunkArray(categoryOptions, 5).map((row, rowIndex) => (
// 									<div
// 										key={rowIndex}
// 										className="flex justify-center gap-4 lg:gap-6 w-full"
// 									>
// 										{row.map((category) => (
// 											<Link
// 												key={category.value}
// 												to="/search"
// 												search={{ categorias: [category.value] }}
// 												className="font-medium text-sm text-gray-900 hover:text-primary-600 transition-colors text-center p-3
// 										rounded-lg hover:bg-white/50 border border-gray-200 hover:border-primary-500"
// 											>
// 												{category.label}
// 											</Link>
// 										))}
// 									</div>
// 								))}
// 							</div>
// 						</div>
// 						<Link
// 							to="/search"
// 							className="text-primary-500 text-lg font-medium hover:underline flex gap-3 align-center justify-center w-full"
// 						>
// 							Ver Todos
// 							<ArrowRight className="rounded-full border-2 border-solid border-current h-[26px] w-[26px]" />
// 						</Link>
// 					</div>{" "}
// 					{/* Navigate By */}
// 					<div className="w-full flex flex-col justify-center items-center gap-7 py-8 px-4 max-w-9xl mx-auto">
// 						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
// 							Navegue por:
// 						</h1>
// 						<div className="w-full flex flex-col items-center gap-4">
// 							{/* Mobile: 2 columns */}
// 							<div className="grid grid-cols-2 gap-3 w-full sm:hidden">
// 								{(eventTypeOptions || []).map((item) => (
// 									<Link
// 										key={item.value}
// 										to="/search"
// 										search={{ tipos: [item.value] }}
// 										className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center border border-primary-200 bg-primary-50/30"
// 									>
// 										<span className="text-sm font-medium leading-tight">
// 											{item.label}
// 										</span>
// 									</Link>
// 								))}
// 							</div>

// 							{/* Tablet: 3 columns per row */}
// 							<div className="hidden sm:flex md:hidden flex-col items-center gap-4 w-full">
// 								{chunkArray(eventTypeOptions, 3).map((row, rowIndex) => (
// 									<div
// 										key={rowIndex}
// 										className="flex justify-center gap-4 w-full"
// 									>
// 										{row.map((item) => (
// 											<Link
// 												key={item.value}
// 												to="/search"
// 												search={{ tipos: [item.value] }}
// 												className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center border border-primary-200 bg-primary-50/30"
// 											>
// 												<span className="text-sm font-medium leading-tight">
// 													{item.label}
// 												</span>
// 											</Link>
// 										))}
// 									</div>
// 								))}
// 							</div>

// 							{/* Desktop: 5 columns per row */}
// 							<div className="hidden md:flex flex-col items-center gap-4 w-full">
// 								{chunkArray(eventTypeOptions, 5).map((row, rowIndex) => (
// 									<div
// 										key={rowIndex}
// 										className="flex justify-center gap-4 lg:gap-6 w-full"
// 									>
// 										{row.map((eventType) => (
// 											<Link
// 												key={eventType.value}
// 												to="/search"
// 												search={{ tipos: [eventType.value] }}
// 												className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center border border-primary-200 bg-primary-50/30"
// 											>
// 												<span className="text-sm font-medium leading-tight">
// 													{eventType.label}
// 												</span>
// 											</Link>
// 										))}
// 									</div>
// 								))}
// 							</div>
// 						</div>
// 					</div>
// 					{/* Gêneros Musicais */}
// 					<div className="w-full flex flex-col justify-center items-center gap-7 py-8 px-4 max-w-9xl mx-auto">
// 						<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
// 							Gêneros Musicais
// 						</h1>
// 						<div className="w-full flex flex-col items-center gap-4">
// 							{/* Mobile: 2 columns */}
// 							<div className="grid grid-cols-2 gap-3 w-full sm:hidden">
// 								{(musicalGenreOptions || []).map((genero) => (
// 									<Link
// 										key={genero.value}
// 										to="/search"
// 										search={{ generos: [genero.value] }}
// 										className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center border border-primary-200 bg-primary-50/30"
// 									>
// 										<span className="text-sm font-medium leading-tight">
// 											{genero.label}
// 										</span>
// 									</Link>
// 								))}
// 							</div>

// 							{/* Tablet: 3 columns per row */}
// 							<div className="hidden sm:flex md:hidden flex-col items-center gap-4 w-full">
// 								{chunkArray(musicalGenreOptions, 3).map((row, rowIndex) => (
// 									<div
// 										key={rowIndex}
// 										className="flex justify-center gap-4 w-full"
// 									>
// 										{row.map((genero) => (
// 											<Link
// 												key={genero.value}
// 												to="/search"
// 												search={{ generos: [genero.value] }}
// 												className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center border border-primary-200 bg-primary-50/30"
// 											>
// 												<span className="text-sm font-medium leading-tight">
// 													{genero.label}
// 												</span>
// 											</Link>
// 										))}
// 									</div>
// 								))}
// 							</div>

// 							{/* Desktop: 5 columns per row */}
// 							<div className="hidden md:flex flex-col items-center gap-4 w-full">
// 								{chunkArray(musicalGenreOptions, 5).map((row, rowIndex) => (
// 									<div
// 										key={rowIndex}
// 										className="flex justify-center gap-4 lg:gap-6 w-full"
// 									>
// 										{row.map((genero) => (
// 											<Link
// 												key={genero.value}
// 												to="/search"
// 												search={{ generos: [genero.value] }}
// 												className="flex flex-col items-center gap-2 text-primary-700 hover:text-primary-700 transition-colors p-3 rounded-lg hover:bg-primary-50 text-center border border-primary-200 bg-primary-50/30"
// 											>
// 												<span className="text-sm font-medium leading-tight">
// 													{genero.label}
// 												</span>
// 											</Link>
// 										))}
// 									</div>
// 								))}
// 							</div>
// 						</div>
// 					</div>
// 					{/* Testimonials */}
// 					<div className="relative w-full flex flex-col justify-center items-center gap-7 py-8 px-4 max-w-9xl mx-auto">
// 						<div className="flex flex-col justify-center items-center gap-5 w-full max-w-2xl text-center">
// 							<h1 className="font-semibold text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-gray-900">
// 								O que nossos usuários estão dizendo:
// 							</h1>
// 							<p className="text-gray-500 text-sm sm:text-base lg:text-lg font-normal">
// 								Experiências compartilhadas por quem confiou em nossa plataforma
// 							</p>
// 						</div>

// 						{/* Carousel */}
// 						<div className="relative w-full overflow-hidden">
// 							{/* Mobile to Large: Single card carousel */}
// 							<div className="xl:hidden">
// 								<div
// 									className="flex transition-transform duration-300 ease-in-out"
// 									style={{
// 										transform: `translateX(-${currentTestimonyIndex * 100}%)`,
// 									}}
// 								>
// 									{Array.from({ length: totalTestimonyCards }).map(
// 										(_, index) => (
// 											<div key={index} className="w-full flex-shrink-0">
// 												<div className="w-full mx-auto">
// 													<TestimonialCard
// 														hired="Banda Contratada"
// 														name="Cliente Satisfeito"
// 														numberOfStars={5}
// 													/>
// 												</div>
// 											</div>
// 										)
// 									)}
// 								</div>
// 							</div>
// 							{/* Extra Large: Grid layout with 3 columns */}
// 							<div className="hidden xl:grid xl:grid-cols-3 gap-6 max-w-6xl mx-auto">
// 								{Array.from({ length: totalTestimonyCards }).map((_, index) => (
// 									<TestimonialCard
// 										key={index}
// 										hired="Banda Contratada"
// 										name="Cliente Satisfeito"
// 										numberOfStars={5}
// 									/>
// 								))}
// 							</div>
// 						</div>

// 						{/* Navigation - show up to large screens */}
// 						<div className="flex items-center justify-center gap-3 text-gray-500 xl:hidden">
// 							<button
// 								className="rounded-full shadow-md bg-white w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
// 								disabled={currentTestimonyIndex === 0}
// 								onClick={() => {
// 									setCurrentTestimonyIndex((previous) =>
// 										Math.max(previous - 1, 0)
// 									);
// 								}}
// 							>
// 								<ArrowLeft size={16} />
// 							</button>
// 							<div className="flex gap-2">
// 								{Array.from({ length: totalTestimonyCards }).map((_, index) => (
// 									<div
// 										key={index}
// 										className={`w-2 h-2 rounded-full transition-colors ${
// 											index === currentTestimonyIndex
// 												? "bg-primary-600"
// 												: "bg-gray-300"
// 										}`}
// 									/>
// 								))}
// 							</div>
// 							<button
// 								className="rounded-full shadow-md bg-white w-10 h-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
// 								disabled={currentTestimonyIndex === totalTestimonyCards - 1}
// 								onClick={() => {
// 									setCurrentTestimonyIndex((previous) =>
// 										Math.min(previous + 1, totalTestimonyCards - 1)
// 									);
// 								}}
// 							>
// 								<ArrowRight size={16} />
// 							</button>
// 						</div>
// 					</div>
// 					{/* FAQ questions */}
// 					<div className="relative flex flex-col items-center w-full px-4 sm:px-8 py-8 max-w-9xl mx-auto">
// 						<div className="flex flex-col justify-center items-center text-center w-full gap-6 mb-8">
// 							<h1 className="font-semibold text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-gray-900">
// 								Dúvidas Frequentes
// 							</h1>
// 							<p className="text-gray-500 text-sm sm:text-base lg:text-lg max-w-2xl">
// 								Encontre respostas para as perguntas mais comuns sobre o uso da
// 								nossa plataforma
// 							</p>
// 						</div>

// 						<div className="w-full">
// 							<FAQAccordion items={faqData} />
// 						</div>
// 					</div>
// 					<footer className="bg-[#FCFCFD] w-full flex flex-col justify-center items-center px-4 sm:px-8 border border-solid border-gray-200 pt-12 pb-8">
// 						<div className="w-full max-w-9xl mx-auto flex flex-col gap-8">
// 							<div className="flex justify-center sm:justify-start">
// 								<VibrattoLogo />
// 							</div>
// 							<div className="flex justify-center sm:justify-start items-center gap-4 sm:gap-6 lg:gap-8 text-gray-500 font-medium text-sm sm:text-base flex-wrap">
// 								<a className="hover:underline transition-colors" href="#">
// 									Voltar ao topo
// 								</a>
// 								{!isAuthenticated && (
// 									<>
// 										<a
// 											className="hover:underline transition-colors"
// 											href="/register"
// 										>
// 											Cadastrar-se
// 										</a>
// 										<a
// 											className="hover:underline transition-colors"
// 											href="/login"
// 										>
// 											Entrar
// 										</a>
// 									</>
// 								)}
// 							</div>

// 							<hr className="w-full border-gray-200" />

// 							<div className="flex w-full items-center justify-between flex-col sm:flex-row gap-4">
// 								<p className="text-gray-400 text-sm sm:text-base">
// 									© 2025 Vibratto - Projeto Atual 20260513
// 								</p>
// 								<div className="flex gap-4 items-center justify-center">
// 									<a
// 										href="#"
// 										className="text-gray-400 hover:text-gray-600 transition-colors"
// 									>
// 										<Instagram size={20} />
// 									</a>
// 									<a
// 										href="#"
// 										className="text-gray-400 hover:text-gray-600 transition-colors"
// 									>
// 										<Facebook size={20} />
// 									</a>
// 								</div>
// 							</div>
// 						</div>
// 					</footer>
// 				</div>
// 			</div>
// 		</MainLayout>
// 	);
// };

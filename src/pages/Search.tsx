import { useEffect, useState, useRef, useMemo } from "react";
import { Search, X, ArrowLeft, MapPin } from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Button } from "../components/ui/Button/Button";
import { InputField } from "../components/forms/InputField/InputField";
import { Select } from "../components/forms/Select/Select";
import { ArtistCardWithFavorites } from "../components/cards/ArtistCard/ArtistCardWithFavorites";
import { MainLayout } from "../components/layout/MainLayout";
import { useSearchMusicalProducts } from "../hooks/useMusicalProducts";

import { useSearchFiltersWithURL } from "../hooks/useSearchFiltersWithURL";
import { useDebounce } from "../hooks/useDebounceSimple";
import type { MusicalProductApiResponse } from "../api/types";
import { useFilterLookup } from "@/features/MusicalProfile/hooks/useFilterLookup";

export const SearchPage = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// Ref to focus on the search input
	const searchInputRef = useRef<HTMLInputElement>(null);

	// URL-aware filters hook
	const {
		filters,
		updateFilters,
		toSearchRequest,
		hasActiveFilters,
		clearFilters,

		selectedCities,
		selectedCategories,
		selectedGenres,
		selectedEventTypes,
		setSelectedCities,
		setSelectedCategories,
		setSelectedGenres,
		setSelectedEventTypes,
	} = useSearchFiltersWithURL();

	// Local state for search input with debounce
	const [searchInput, setSearchInput] = useState(filters.NomeOuDescricao ?? "");
	const debouncedSearchTerm = useDebounce(searchInput, 500);

	const [searchCity, setSearchCity] = useState("");
	const [cityPage, setCityPage] = useState(1);
	const [hasMoreCities, setHasMoreCities] = useState(true);

	const handleClearFilters = () => {
		clearFilters();
		setSearchInput("");
	};

	// API hooks
	const {
		cityOptions,
		categoryOptions,
		eventTypeOptions,
		musicalGenreOptions,
		isLoadingCities,
		isLoadingCategories,
		isLoadingEventTypes,
		isLoadingGenresMusical,
		isFetchingCities,
	} = useFilterLookup({
		cityPage,
		setCityPage,
		setHasMoreCities,
		hasMoreCities,
		cityPageSize: 20,
		searchCityByName: searchCity,
	});

	// Focus on the search input when the component mounts.
	useEffect(() => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, []);

	// Update search term when debounced value changes
	useEffect(() => {
		updateFilters({
			NomeOuDescricao: debouncedSearchTerm || undefined,
			pagina: 1,
		});
	}, [debouncedSearchTerm, updateFilters]);

	// Search request based on current filters
	const searchRequest = toSearchRequest();

	const { data: searchResults, isLoading } = useSearchMusicalProducts(
		searchRequest,
		true
	);

	const visiblePagination = useMemo(() => {
		const totalpages = searchResults?.paginacao.totalPaginas || 0;
		const currentpage = searchResults?.paginacao.paginaAtual || 1;

		let start = Math.max(1, currentpage - 2);
		const end = Math.min(totalpages, start + 4);

		if (end - start < 4) {
			start = Math.min(1, end - 4);
		}

		const length = Math.max(0, end - start + 1);
		return Array.from({ length }, (_, index) => start + index);
	}, [
		searchResults?.paginacao.totalPaginas,
		searchResults?.paginacao.paginaAtual,
	]);

	// Force initial search for São Paulo when no filters are active
	useEffect(() => {
		if (
			!isLoading &&
			!searchResults &&
			!searchRequest.codigoMunicipio &&
			!searchRequest.NomeOuDescricao
		) {
			updateFilters({ pagina: 1 });
		}
	}, [isLoading, searchResults, searchRequest, updateFilters]);

	const handlePageChange = (page: number) => {
		updateFilters({ pagina: page });
	};

	const handleBackNavigation = () => {
		// Check if there's history and if the previous page wasn't the same search route
		if (window.history.length > 1) {
			const currentPath = location.pathname;
			// Use history.back() but with a fallback check
			window.history.back();

			// Set a timeout to check if navigation actually happened
			setTimeout(() => {
				// If we're still on the same path after attempting to go back,
				// it means there was no valid history or we went to the same route
				if (window.location.pathname === currentPath) {
					// Navigate to home without any query parameters
					window.location.href = "/";
				}
			}, 100);
		} else {
			// No history available, go directly to main page without params
			window.location.href = "/";
		}
	};

	return (
		<MainLayout>
			<div className="min-h-screen bg-primary-50/30">
				{/* Search Section */}
				<div className="bg-white shadow-sm">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
						{/* Back Button */}
						<div className="mb-4 sm:mb-6">
							<Button
								variant="outline"
								size="sm"
								className="flex items-center gap-2"
								onClick={handleBackNavigation}
							>
								<ArrowLeft size={16} />
								<span className="hidden xs:inline">Voltar</span>
							</Button>
						</div>
						<div className="text-center mb-6 sm:mb-8">
							<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
								Encontre o profissional da música ideal para você
							</h1>
							<p className="text-gray-600 text-base sm:text-lg px-2">
								Utilize filtros para que se enquadre perfeitamente no seu evento
								ou na sua banda
							</p>
						</div>
						{/* Mobile-first responsive search layout */}
						<div className="space-y-4 mb-6">
							{/* Search Input - Full width on mobile */}
							<div className="w-full">
								<InputField
									ref={searchInputRef}
									icon={<Search size={20} />}
									label="Buscar"
									placeholder="Buscar artistas, bandas..."
									value={searchInput}
									onChange={(event) => {
										setSearchInput(event.target.value);
									}}
									className="text-sm"
								/>
							</div>

							{/* Location and Filters row - stacked on mobile, side by side on tablet+ */}
							<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
								{/* Location Filter */}
								<div className="flex-1">
									<Select
										icon={<MapPin size={18} />}
										label="Localização"
										name="Localizacao"
										options={cityOptions}
										placeholder={
											isLoadingCities
												? "Carregando..."
												: "Filtrar pela localização"
										}
										selectedOptions={selectedCities}
										setSelectedOptions={(options) => {
											setSelectedCities(options);
											const option = options.find((item) => item);

											updateFilters({
												codigoMunicipio: option,
												pagina: 1,
											});
										}}
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
							</div>
						</div>

						{/* Advanced Filters - Responsive Layout */}
						<div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary-50/20 rounded-lg border border-primary-50">
							<div className="space-y-4">
								<h3 className="text-lg font-semibold text-gray-900 mb-3">
									Filtros Avançados
								</h3>

								{/* Mobile: Stack filters vertically, Desktop: 3 columns */}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
									{/* Category Filter - Multiple Selection */}
									<div className="space-y-2">
										<Select
											label="Categoria"
											name="categorias"
											placeholder={
												isLoadingCategories
													? "Carregando..."
													: "Filtrar por categoria"
											}
											options={categoryOptions}
											selectedOptions={selectedCategories}
											setSelectedOptions={(options) => {
												setSelectedCategories(options);

												const option = options.find((item) => item);

												updateFilters({
													categorias: option,
													pagina: 1,
												});
											}}
										/>
									</div>

									{/* Event Type Filter - Multiple Selection */}
									<div className="space-y-2">
										<Select
											label="Tipo de Evento"
											name="tipos-evento"
											placeholder={
												isLoadingEventTypes
													? "Carregando..."
													: "Filtrar por tipo de evento"
											}
											options={eventTypeOptions}
											selectedOptions={selectedEventTypes}
											setSelectedOptions={(options) => {
												setSelectedEventTypes(options);

												const option = options.find((item) => item);

												updateFilters({
													tiposEvento: option,
													pagina: 1,
												});
											}}
										/>
									</div>

									{/* Genre Filter - Multiple Selection */}
									<div className="space-y-2 sm:col-span-2 lg:col-span-1">
										<Select
											label="Gênero Musical"
											name="generos"
											placeholder={
												isLoadingGenresMusical
													? "Carregando..."
													: "Filtrar por gênero musical"
											}
											options={musicalGenreOptions}
											selectedOptions={selectedGenres}
											setSelectedOptions={(options) => {
												setSelectedGenres(options);

												const option = options.find((item) => item);

												updateFilters({
													generosMusicais: option,
													pagina: 1,
												});
											}}
										/>
									</div>
								</div>

								{/* Filter Actions */}
								<div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
									{hasActiveFilters && (
										<Button
											className="flex items-center gap-2 w-full sm:w-auto"
											size="sm"
											variant="outline"
											onClick={handleClearFilters}
										>
											<X size={16} />
											Limpar filtros
										</Button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Results */}
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
					{/* Results Header */}
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
						<div className="flex-1">
							<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
								{searchResults?.paginacao?.totalPaginas
									? (() => {
											const totalItems =
												searchResults.paginacao.totalItens ?? 0;

											const itemText =
												totalItems < 2
													? "artista encontrado"
													: "artistas encontrados";
											return `${totalItems > 0 ? totalItems : "Nenhum"} ${itemText}`;
										})()
									: "Resultados da Busca"}
							</h2>
							{searchResults?.paginacao &&
								searchResults.paginacao.totalPaginas > 1 && (
									<p className="text-gray-600 mt-1 text-sm sm:text-base">
										Página {searchResults.paginacao.paginaAtual} de{" "}
										{searchResults.paginacao.totalPaginas}
									</p>
								)}
						</div>
					</div>
					{/* Loading State */}
					{isLoading && (
						<div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
							{Array.from({ length: 10 }, (_, index) => (
								<div
									key={`loading-skeleton-${index}`}
									className="animate-pulse bg-white rounded-2xl overflow-hidden shadow-lg"
								>
									<div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-48 sm:h-56 w-full"></div>
									<div className="p-4 sm:p-5">
										<div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-5 sm:h-6 rounded-lg w-3/4 mb-3"></div>
										<div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-3 sm:h-4 rounded-lg w-1/2 mb-4"></div>
										<div className="flex gap-2 mb-4">
											<div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-5 sm:h-6 rounded-full w-14 sm:w-16"></div>
											<div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-5 sm:h-6 rounded-full w-18 sm:w-20"></div>
										</div>
										<div className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 h-9 sm:h-10 rounded-xl w-full"></div>
									</div>
								</div>
							))}
						</div>
					)}
					{/* Results Grid */}
					{!isLoading &&
						searchResults?.dados &&
						searchResults.dados.length > 0 && (
							<>
								<div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
									{searchResults.dados.map(
										(product: MusicalProductApiResponse) => (
											<div key={product.id} className="relative">
												<ArtistCardWithFavorites
													product={product}
													onProfileClick={() =>
														navigate({
															to: "/band/profile/$id",
															params: { id: product.id.toString() },
														})
													}
												/>
											</div>
										)
									)}
								</div>

								{/* Pagination - Mobile Responsive */}
								{searchResults?.paginacao &&
									searchResults.paginacao.totalPaginas > 1 && (
										<div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 sm:mt-12">
											{/* Mobile: Simplified pagination */}
											<div className="flex sm:hidden items-center justify-between w-full max-w-sm">
												<Button
													disabled={searchResults.paginacao.paginaAtual === 1}
													variant="outline"
													size="sm"
													className="flex items-center gap-2"
													onClick={() => {
														handlePageChange(
															searchResults.paginacao.paginaAtual - 1
														);
													}}
												>
													← Anterior
												</Button>

												<div className="flex items-center gap-2 text-sm text-gray-600">
													<span className="font-medium">
														{searchResults.paginacao.paginaAtual}
													</span>
													<span>de</span>
													<span className="font-medium">
														{searchResults.paginacao.totalPaginas}
													</span>
												</div>

												<Button
													variant="outline"
													size="sm"
													className="flex items-center gap-2"
													disabled={
														searchResults.paginacao.paginaAtual ===
														searchResults.paginacao.totalPaginas
													}
													onClick={() => {
														handlePageChange(
															searchResults.paginacao.paginaAtual + 1
														);
													}}
												>
													Próxima →
												</Button>
											</div>

											{/* Desktop: Full pagination */}
											<div className="hidden sm:flex items-center space-x-3">
												<Button
													disabled={searchResults.paginacao.paginaAtual === 1}
													variant="outline"
													className="px-4 py-2 text-sm font-medium"
													onClick={() => {
														handlePageChange(
															searchResults.paginacao.paginaAtual - 1
														);
													}}
												>
													← Anterior
												</Button>

												<div className="flex space-x-1">
													{visiblePagination.map((page) => {
														const isCurrentPage =
															page === searchResults.paginacao.paginaAtual;

														return (
															<Button
																key={page}
																variant={isCurrentPage ? "primary" : "outline"}
																className={`px-4 py-2 text-sm font-medium ${
																	isCurrentPage
																		? "bg-primary-600 text-white"
																		: "text-gray-700 hover:text-primary-600 hover:bg-primary-100"
																}`}
																onClick={() => {
																	handlePageChange(page);
																}}
															>
																{page}
															</Button>
														);
													})}
												</div>

												<Button
													variant="outline"
													className="px-4 py-2 text-sm font-medium"
													disabled={
														searchResults.paginacao.paginaAtual ===
														searchResults.paginacao.totalPaginas
													}
													onClick={() => {
														handlePageChange(
															searchResults.paginacao.paginaAtual + 1
														);
													}}
												>
													Próxima →
												</Button>
											</div>
										</div>
									)}
							</>
						)}{" "}
					{/* No Results - Mobile Responsive */}
					{!isLoading && searchResults?.dados?.length === 0 && (
						<div className="text-center py-12 sm:py-16 lg:py-20 px-4">
							<div className="bg-gray-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
								<Search className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 text-gray-400" />
							</div>
							<h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2 sm:mb-3">
								Nenhum artista encontrado
							</h3>
							<p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
								Não encontramos artistas que correspondam aos seus critérios de
								busca. Tente ajustar os filtros ou usar termos diferentes.
							</p>

							{/* Suggestions for better search */}
							<div className="bg-primary-50 rounded-lg p-4 sm:p-6 max-w-lg mx-auto">
								<h4 className="font-semibold text-primary-900 mb-3 text-sm sm:text-base">
									Dicas para melhorar sua busca:
								</h4>
								<ul className="text-primary-800 text-sm space-y-2 text-left">
									<li>• Tente usar termos mais gerais</li>
									<li>• Remova alguns filtros aplicados</li>
									<li>• Verifique a ortografia dos termos de busca</li>
									<li>• Experimente buscar por gênero musical</li>
								</ul>
							</div>
						</div>
					)}
				</main>
			</div>
		</MainLayout>
	);
};

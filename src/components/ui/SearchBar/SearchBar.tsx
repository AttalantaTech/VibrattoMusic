import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "../Input/Input";
import { Button } from "../Button/Button";
import { useDebounce } from "../../../hooks/useDebounceSimple";
import { useSearchMusicalProducts } from "../../../hooks/useMusicalProducts";

interface SearchBarProps {
	placeholder?: string;
	onSearch?: (query: string) => void;
	className?: string;
	initialValue?: string;
}

export const SearchBar = ({
	placeholder = "Buscar artistas, bandas, gêneros...",
	onSearch,
	className = "",
	initialValue = "",
}: SearchBarProps) => {
	const [searchQuery, setSearchQuery] = useState(initialValue);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [searchHistory, setSearchHistory] = useState<Array<string>>([]);
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionRef = useRef<HTMLDivElement>(null);

	// Debounce search query for API calls
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	// Search API results for suggestions
	const { data: searchResults, isLoading: isSearching } =
		useSearchMusicalProducts(
			{
				NomeOuDescricao:
					debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : undefined,
				limite: 5,
				tamanhoPagina: 5,
				pagina: 1,
				codigoMunicipio: 3550308,
				ordenarPorAvaliacao: true,
			},
			debouncedSearchQuery.length >= 2 // Only search if query has at least 2 characters
		);

	useEffect(() => {
		setSearchQuery(initialValue);
	}, [initialValue]);

	useEffect(() => {
		const history = localStorage.getItem("vibratto-search-history");
		if (history) {
			try {
				setSearchHistory(JSON.parse(history) as Array<string>);
			} catch (error) {
				console.error("Error loading search history:", error);
			}
		}
	}, []);

	const saveToHistory = (query: string) => {
		if (query.trim()) {
			const newHistory = [
				query,
				...searchHistory.filter((item) => item !== query),
			].slice(0, 5);
			setSearchHistory(newHistory);
			localStorage.setItem(
				"vibratto-search-history",
				JSON.stringify(newHistory)
			);
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionRef.current &&
				!suggestionRef.current.contains(event.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (searchQuery.trim()) {
			saveToHistory(searchQuery.trim());
			setShowSuggestions(false);
			if (onSearch) {
				onSearch(searchQuery.trim());
			} else {
				void navigate({
					to: "/search",
					search: { q: searchQuery.trim() },
				});
			}
		}
	};

	const handleSuggestionClick = (suggestion: string) => {
		setSearchQuery(suggestion);
		saveToHistory(suggestion);
		setShowSuggestions(false);
		if (onSearch) {
			onSearch(suggestion);
		} else {
			void navigate({
				to: "/search",
				search: { q: suggestion },
			});
		}
	};

	const handleClear = () => {
		setSearchQuery("");
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(event.target.value);
		// Show suggestions if there's input or history
		if (event.target.value.length > 0 || searchHistory.length > 0) {
			setShowSuggestions(true);
		}
	};

	const handleInputFocus = () => {
		// Show suggestions on focus if there's query or history
		if (searchQuery.length > 0 || searchHistory.length > 0) {
			setShowSuggestions(true);
		}
	};

	const handleArtistSelect = (artistId: number, artistName: string) => {
		saveToHistory(artistName);
		setShowSuggestions(false);
		void navigate({
			to: "/band/profile/$id",
			params: { id: artistId.toString() },
		});
	};

	const clearSearchHistory = () => {
		setSearchHistory([]);
		localStorage.removeItem("vibratto-search-history");
		setShowSuggestions(false);
	};

	const filteredHistory = searchHistory.filter((item) =>
		item.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<form onSubmit={handleSubmit} className={`relative ${className}`}>
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
				<Input
					ref={inputRef}
					type="text"
					placeholder={placeholder}
					value={searchQuery}
					onChange={handleInputChange}
					onFocus={handleInputFocus}
					className="pl-10 pr-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
				/>
				{searchQuery && (
					<Button
						type="button"
						variant="transparent"
						size="sm"
						onClick={handleClear}
						className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
					>
						<X className="w-4 h-4 text-gray-400" />
					</Button>
				)}
			</div>

			{showSuggestions &&
				(searchResults?.data?.length ||
					filteredHistory.length > 0 ||
					searchHistory.length > 0 ||
					isSearching) && (
					<div
						ref={suggestionRef}
						className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
					>
						{/* API Search Results */}
						{searchQuery.length >= 2 && (
							<div>
								{isSearching ? (
									<div className="px-4 py-3 text-center">
										<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
										<span className="text-xs text-gray-500 mt-2 block">
											Buscando...
										</span>
									</div>
								) : searchResults?.data && searchResults.data.length > 0 ? (
									<div>
										<div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
											Artistas encontrados
										</div>
										{searchResults.data.slice(0, 5).map((artist) => (
											<button
												key={artist.id}
												onClick={() => {
													handleArtistSelect(artist.id, artist.nome);
												}}
												className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
											>
												<User className="w-4 h-4 text-blue-500" />
												<div className="flex-1 min-w-0">
													<div className="text-sm font-medium text-gray-900 truncate">
														{artist.nome}
													</div>
													<div className="text-xs text-gray-500 truncate">
														{artist.cidade?.nome} •{" "}
														{artist.generoMusical
															?.map((g) => g.nome)
															.join(", ")}
													</div>
												</div>
											</button>
										))}
									</div>
								) : searchQuery.length >= 2 && !isSearching ? (
									<div className="px-4 py-3 text-center text-sm text-gray-500">
										Nenhum artista encontrado
									</div>
								) : null}
							</div>
						)}

						{/* Search History */}
						{(filteredHistory.length > 0 ||
							(searchHistory.length > 0 && !searchQuery)) && (
							<div
								className={
									searchQuery.length >= 2 ? "border-t border-gray-100" : ""
								}
							>
								<div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 flex items-center justify-between">
									<span>Buscas recentes</span>
									<button
										onClick={clearSearchHistory}
										className="text-blue-600 hover:text-blue-800 text-xs"
									>
										Limpar
									</button>
								</div>
								{(filteredHistory.length > 0
									? filteredHistory
									: searchHistory
								).map((suggestion, index) => (
									<button
										key={index}
										onClick={() => {
											handleSuggestionClick(suggestion);
										}}
										className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
									>
										<Clock className="w-4 h-4 text-gray-400" />
										<span className="text-sm text-gray-700">{suggestion}</span>
									</button>
								))}
							</div>
						)}
					</div>
				)}
		</form>
	);
};

import { useEffect, useState } from "react";
import type { FilterOption } from "@/api/types";
import type { Option } from "@/components/forms/Select/Select";
import { useCidades } from "@/hooks/useFilters";

const PAGE_SIZE = 20;

/**
 * Searchable list of every city in the database ("São Paulo - SP"), loaded
 * 20 at a time as the list scrolls. `enabled` keeps a closed form from
 * asking for it.
 */
export const useCitySearch = (enabled: boolean) => {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [cities, setCities] = useState<Array<FilterOption>>([]);

	const { data, isFetching } = useCidades({
		enabled,
		paginationFilter: { pagina: page, tamanhoPagina: PAGE_SIZE, nome: search },
	});

	// A new search starts over from the first page
	useEffect(() => {
		setPage(1);
		setHasMore(true);
	}, [search]);

	useEffect(() => {
		if (!data) return;

		setCities((previous) => {
			if (page === 1) return data;
			const known = new Set(previous.map((city) => city.Id));
			return [...previous, ...data.filter((city) => !known.has(city.Id))];
		});
		if (data.length < PAGE_SIZE) setHasMore(false);
	}, [data, page]);

	const options: Array<Option> = cities.map((city) => ({
		value: String(city.Id),
		label: city.Nome,
	}));

	return {
		options,
		search,
		setSearch,
		isFetching,
		loadMore: () => {
			if (hasMore && !isFetching) setPage((previous) => previous + 1);
		},
	};
};

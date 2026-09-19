import type { ApiClient } from "../core/client";
import type {
	FilterHomeImage,
	FilterOption,
	FilterOptionInstrument,
	FilterOptionsRequest,
	FilterOptionsWithPagination,
	FilterType,
	PaginationFilter,
} from "../types";

export class FilterService {
	constructor(private readonly apiClient: ApiClient) {}

	/**
	 * Get filter options by type
	 */

	async getFilterOptions({
		filterType,
		paginationFilter,
	}: FilterOptionsRequest): Promise<Array<FilterOption>> {
		if (paginationFilter) {
			const response = await this.apiClient.get<FilterOptionsWithPagination>(
				`filtro/${filterType}`,
				{
					params: paginationFilter,
				}
			);

			return response.dados;
		}

		return this.apiClient.get<Array<FilterOption>>(`filtro/${filterType}`);
	}

	/**
	 * Get filter options by type
	 */
	async getFilterHomeImages(
		filterType: FilterType
	): Promise<Array<FilterHomeImage>> {
		return this.apiClient.get<Array<FilterHomeImage>>(`filtro/${filterType}`);
	}

	/**
	 * Get filter options by instruments
	 */
	async getFilterOptionsInstruments(
		filterType: FilterType
	): Promise<Array<FilterOptionInstrument>> {
		return this.apiClient.get<Array<FilterOptionInstrument>>(
			`filtro/${filterType}`
		);
	}

	/**
	 * Get all filter types
	 */
	async getTipoFiltro(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({ filterType: "TipoFiltro" as FilterType });
	}

	/**
	 * Get categories
	 */
	async getCategorias(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({ filterType: "Categoria" as FilterType });
	}

	/**
	 * Get cities
	 */
	async getCidades(
		paginationFilter?: PaginationFilter
	): Promise<Array<FilterOption>> {
		return this.getFilterOptions({
			filterType: "Cidade" as FilterType,
			paginationFilter: {
				nome: paginationFilter?.nome,
				pagina: paginationFilter?.pagina,
				tamanhoPagina: paginationFilter?.tamanhoPagina,
			},
		});
	}

	/**
	 * Get event types
	 */
	async getTiposEvento(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({ filterType: "TipoEvento" as FilterType });
	}

	/**
	 * Get musical genres
	 */
	async getGenerosMusicais(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({ filterType: "GeneroMusical" as FilterType });
	}

	/**
	 * Get instrument types
	 */
	async getInstruments(): Promise<Array<FilterOptionInstrument>> {
		return this.getFilterOptionsInstruments("TipoInstrumento" as FilterType);
	}

	/**
	 * Get social networks
	 */
	async getSocialNetworks(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({ filterType: "RedeSocial" as FilterType });
	}

	/**
	 * Get production types
	 */
	async getProductionTypes(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({ filterType: "TipoProducao" as FilterType });
	}

	/**
	 * Get payment methods (Forma de Pagamento)
	 */
	async getFormasPagamento(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({
			filterType: "FormaPagamento" as FilterType,
		});
	}

	/**
	 * Get payment conditions (Condições de Pagamento)
	 */
	async getCondicoesPagamento(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({
			filterType: "CondicoesPagamento" as FilterType,
		});
	}

	/**
	 * Get remaining payment conditions (Condição restante)
	 */
	async getCondicoesPagamentoRestante(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({
			filterType: "CondicoesPagamentoRestante" as FilterType,
		});
	}

	/**
	 * Get proposal rejection reasons (Motivos de Rejeição de Proposta)
	 */
	async getMotivosRejeicaoProposta(): Promise<Array<FilterOption>> {
		return this.getFilterOptions({
			filterType: "MotivoRejeicaoProposta" as FilterType,
		});
	}

	/**
	 * Get Images to inital home
	 */
	async getHomeImages(): Promise<Array<FilterHomeImage>> {
		return this.getFilterHomeImages("MotivoRejeicaoProposta" as FilterType);
	}
}

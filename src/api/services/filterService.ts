import type { ApiClient } from "../core/client";
import type {
	FilterHomeImage,
	FilterOption,
	FilterOptionInstrument,
	FilterType,
} from "../types";

export class FilterService {
	constructor(private readonly apiClient: ApiClient) {}

	/**
	 * Get filter options by type
	 */
	async getFilterOptions(filterType: FilterType): Promise<Array<FilterOption>> {
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
		return this.getFilterOptions("TipoFiltro" as FilterType);
	}

	/**
	 * Get categories
	 */
	async getCategorias(): Promise<Array<FilterOption>> {
		return this.getFilterOptions("Categoria" as FilterType);
	}

	/**
	 * Get cities
	 */
	async getCidades(): Promise<Array<FilterOption>> {
		return this.getFilterOptions("Cidade" as FilterType);
	}

	/**
	 * Get event types
	 */
	async getTiposEvento(): Promise<Array<FilterOption>> {
		return this.getFilterOptions("TipoEvento" as FilterType);
	}

	/**
	 * Get musical genres
	 */
	async getGenerosMusicais(): Promise<Array<FilterOption>> {
		return this.getFilterOptions("GeneroMusical" as FilterType);
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
		return this.getFilterOptions("RedeSocial" as FilterType);
	}

	/**
	 * Get production types
	 */
	async getProductionTypes(): Promise<Array<FilterOption>> {
		return this.getFilterOptions("TipoProducao" as FilterType);
	}

	/**
	 * Get payment methods (Forma de Pagamento)
	 */
	async getFormasPagamento(): Promise<Array<FilterOption>> {
		return this.getFilterOptions("FormaPagamento" as FilterType);
	}

	/**
	 * Get payment conditions (Condições de Pagamento)
	 */
	async getCondicoesPagamento(): Promise<Array<FilterOption>> {
		return this.getFilterOptions("CondicoesPagamento" as FilterType);
	}

	/**
	 * Get remaining payment conditions (Condição restante)
	 */
	async getCondicoesPagamentoRestante(): Promise<Array<FilterOption>> {
		return this.getFilterOptions("CondicoesPagamentoRestante" as FilterType);
	}

	/**
	 * Get proposal rejection reasons (Motivos de Rejeição de Proposta)
	 */
	async getMotivosRejeicaoProposta(): Promise<Array<FilterOption>> {
		return this.getFilterOptions("MotivoRejeicaoProposta" as FilterType);
	}

	/**
	 * Get Images to inital home
	 */
	async getHomeImages(): Promise<Array<FilterHomeImage>> {
		return this.getFilterHomeImages("MotivoRejeicaoProposta" as FilterType);
	}
}

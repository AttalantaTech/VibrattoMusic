import type { ApiClient } from "../core/client";
import type {
	MusicalProductSearchRequest,
	MusicalProductListApiResponse,
	MusicalProductApiResponse,
} from "../types";

export class MusicalProductService {
	public constructor(private readonly apiClient: ApiClient) {} /**
	 * Clean search request to ensure only valid fields are sent
	 */
	private cleanSearchRequest(
		searchRequest: MusicalProductSearchRequest
	): MusicalProductSearchRequest {
		const cleanedRequest: MusicalProductSearchRequest = {
			limite: searchRequest.limite,
			ordenarPorAvaliacao: searchRequest.ordenarPorAvaliacao,
			tamanhoPagina: searchRequest.tamanhoPagina,
			pagina: searchRequest.pagina,
		};

		// Only include defined values and expected fields
		if (
			searchRequest.NomeOuDescricao !== undefined &&
			searchRequest.NomeOuDescricao.trim() !== ""
		) {
			cleanedRequest.NomeOuDescricao = searchRequest.NomeOuDescricao.trim();
		}
		if (searchRequest.codigoMunicipio !== undefined) {
			cleanedRequest.codigoMunicipio = searchRequest.codigoMunicipio;
		}
		if (searchRequest.categorias && searchRequest.categorias.length > 0) {
			cleanedRequest.categorias = searchRequest.categorias;
		}
		if (searchRequest.tiposEvento && searchRequest.tiposEvento.length > 0) {
			cleanedRequest.tiposEvento = searchRequest.tiposEvento;
		}
		if (
			searchRequest.generosMusicais &&
			searchRequest.generosMusicais.length > 0
		) {
			cleanedRequest.generosMusicais = searchRequest.generosMusicais;
		}

		return cleanedRequest;
	}
	/**
	 * Search musical products with filters
	 */ public async searchProducts(
		searchRequest: MusicalProductSearchRequest,
		ativo: null | true | false = true
	): Promise<MusicalProductListApiResponse> {
		try {
			const cleanedRequest = this.cleanSearchRequest(searchRequest);

			// API returns array directly, not wrapped in pagination object
			const response = await this.apiClient.post<MusicalProductListApiResponse>(
				"produtomusical/listar",
				{ ...cleanedRequest, ativo }
			);

			return response;
		} catch (error: unknown) {
			console.error("Musical products search failed:", {
				message: error instanceof Error ? error.message : "Unknown error",
				status: (error as { response?: { status?: number } })?.response?.status,
				data: (error as { response?: { data?: unknown } })?.response?.data,
				url: (error as { config?: { url?: string } })?.config?.url,
			});
			throw error;
		}
	}
	/**
	 * Get public data for a musical product by ID
	 */
	public async getProductById(
		productId: number,
		ativo = true
	): Promise<Array<MusicalProductApiResponse>> {
		const response = await this.apiClient.post<MusicalProductListApiResponse>(
			"produtomusical/listar",
			{
				Id: productId,
				ativo,
			}
		);

		return response.dados ?? [];
	}

	/**
	 * Get current user's musical products
	 */
	public async getMyProducts(
		searchRequest?: Partial<MusicalProductSearchRequest>
	): Promise<MusicalProductListApiResponse> {
		try {
			const defaultRequest: MusicalProductSearchRequest = {
				limite: 10,
				ordenarPorAvaliacao: true,
				tamanhoPagina: 10,
				pagina: 1,
				...searchRequest,
			};

			const cleanedRequest = this.cleanSearchRequest(defaultRequest);

			// API returns array directly, not wrapped in pagination object
			const response = await this.apiClient.post<MusicalProductListApiResponse>(
				"produtomusical/meusProdutos",
				cleanedRequest
			);

			return response;
		} catch (error: unknown) {
			console.error("My musical products fetch failed:", {
				message: error instanceof Error ? error.message : "Unknown error",
				status: (error as { response?: { status?: number } })?.response?.status,
				data: (error as { response?: { data?: unknown } })?.response?.data,
				url: (error as { config?: { url?: string } })?.config?.url,
			});
			throw error;
		}
	}

	public async updateMusicalProduct(musicalProduct: {
		[key: string]: unknown;
	}): Promise<void> {
		return this.apiClient.post<void>("/produtomusical/altera", musicalProduct);
	}
}

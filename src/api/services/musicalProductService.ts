import type { ApiClient } from "../core/client";
import type {
	MusicalProductSearchRequest,
	MusicalProductListApiResponse,
	MusicalProductApiResponse,
	OnboardingContact,
	OnboardingDetails,
	OnboardingMedia,
	OnboardingImages,
	OnboardingTechnicalConfig,
	OnboardingSchedule,
	OnboardingApiResponse,
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
		searchRequest: MusicalProductSearchRequest
	): Promise<MusicalProductListApiResponse> {
		try {
			const cleanedRequest = this.cleanSearchRequest(searchRequest);

			// API returns array directly, not wrapped in pagination object
			const apiResponse = await this.apiClient.post<
				Array<MusicalProductApiResponse>
			>("produtomusical/listar", cleanedRequest);

			// Transform API response to expected frontend format
			const response: MusicalProductListApiResponse = {
				data: apiResponse,
				pagination: {
					currentPage: searchRequest.pagina || 1,
					totalPages: 1, // Since API doesn't provide pagination info
					totalItems: apiResponse.length,
					itemsPerPage: apiResponse.length,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};

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
		productId: number
	): Promise<MusicalProductApiResponse> {
		return this.apiClient.post("produtomusical/listar", { Id: productId });
	}

	/**
	 * Get onboarding data for a product
	 */
	public async getOnboardingData(
		productId: number
	): Promise<OnboardingApiResponse> {
		return this.apiClient.get(`produtomusical/onboarding/${productId}`);
	}

	/**
	 * Save onboarding contact information (Step 1)
	 */
	public async saveOnboardingContact(
		contactData: OnboardingContact
	): Promise<{ id: number }> {
		return this.apiClient.post<{ id: number }>(
			"produtomusical/onboarding/contato",
			contactData
		);
	}

	/**
	 * Save onboarding details (Step 2)
	 */
	public async saveOnboardingDetails(
		productId: number,
		detailsData: OnboardingDetails
	): Promise<void> {
		return this.apiClient.post<void>(
			`produtomusical/onboarding/${productId}/detalhes`,
			detailsData
		);
	}

	/**
	 * Save onboarding media information (Step 3)
	 */
	public async saveOnboardingMedia(
		productId: number,
		mediaData: OnboardingMedia
	): Promise<void> {
		return this.apiClient.post<void>(
			`produtomusical/onboarding/${productId}/media`,
			mediaData
		);
	}

	/**
	 * Save onboarding images (Step 3)
	 */
	public async saveOnboardingImages(
		productId: number,
		imagesData: OnboardingImages
	): Promise<void> {
		return this.apiClient.post<void>(
			`produtomusical/onboarding/${productId}/imagens`,
			imagesData
		);
	}

	/**
	 * Save onboarding technical configuration (Step 4)
	 */
	public async saveOnboardingTechnicalConfig(
		productId: number,
		technicalData: OnboardingTechnicalConfig
	): Promise<void> {
		return this.apiClient.post<void>(
			`produtomusical/onboarding/${productId}/configuracao-tecnica`,
			technicalData
		);
	}
	/**
	 * Save onboarding schedule (Step 5)
	 */
	public async saveOnboardingSchedule(
		productId: number,
		scheduleData: OnboardingSchedule
	): Promise<void> {
		return this.apiClient.post<void>(
			`produtomusical/onboarding/${productId}/agenda`,
			scheduleData
		);
	}

	/**
	 * Publish the musical product after completing onboarding
	 */
	public async publishMusicalProduct(productId: number): Promise<void> {
		return this.apiClient.post<void>(
			`produtomusical/onboarding/${productId}/publicar`
		);
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
			const apiResponse = await this.apiClient.post<
				Array<MusicalProductApiResponse>
			>("produtomusical/meusProdutos", cleanedRequest);

			// Transform API response to expected frontend format
			const response: MusicalProductListApiResponse = {
				data: apiResponse,
				pagination: {
					currentPage: defaultRequest.pagina || 1,
					totalPages: 1, // Since API doesn't provide pagination info
					totalItems: apiResponse.length,
					itemsPerPage: apiResponse.length,
					hasNextPage: false,
					hasPreviousPage: false,
				},
			};

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
}

import type { ApiClient } from "../core/client";
import type {
	MusicalProductContact,
	MusicalProductDetails,
	MusicalProductMedia,
	MusicalProductImages,
	MusicalProductTechnicalConfig,
	MusicalProductSchedule,
	ScheduleApiResponse,
	OnboardingApiResponse,
	ImageDeleteRequest,
} from "../types";

export class OnboardingService {
	public constructor(private readonly apiClient: ApiClient) {}

	/**
	 * Get onboarding data for a product
	 */
	public async getOnboarding(
		productId: number
	): Promise<OnboardingApiResponse> {
		return this.apiClient.get(`/produtomusical/onboarding/${productId}`);
	}

	/**
	 * Get onboarding pending for logged user
	 */
	public async getOnboardingPending(): Promise<Array<OnboardingApiResponse>> {
		return this.apiClient.get(`produtomusical/onboarding/pendentes`);
	}

	/**
	 * Step 1: Save contact information
	 */
	public async createAndUpdateContact(
		data: MusicalProductContact
	): Promise<{ id: number }> {
		return this.apiClient.post<{ id: number }>(
			"/produtomusical/onboarding/contato",
			data
		);
	}

	/**
	 * Step 2: Save band details
	 */
	public async updateDetails(
		productId: number,
		data: MusicalProductDetails
	): Promise<void> {
		return this.apiClient.post<void>(
			`/produtomusical/onboarding/${productId}/detalhes`,
			data
		);
	}

	/**
	 * Step 3: Save media information
	 */
	public async updateMedia(
		productId: number,
		data: MusicalProductMedia
	): Promise<void> {
		return this.apiClient.post<void>(
			`/produtomusical/onboarding/${productId}/midias`,
			data
		);
	}

	/**
	 * Step 3: Save images
	 */
	public async updateImages(
		productId: number,
		data: MusicalProductImages
	): Promise<void> {
		return this.apiClient.post<void>(
			`/produtomusical/onboarding/${productId}/imagens`,
			data
		);
	}

	/**
	 * Generate pre-signed URL for image upload
	 */
	public async generateImageUrl(data: {
		Evento: string;
		IdCadastro: string;
		ExtensaoArquivo: string;
		IdLista?: null;
	}): Promise<{ url: string }> {
		return this.apiClient.post<{ url: string }>("/imagem/gerar-url", data);
	}

	/**
	 * Delete an uploaded image
	 */
	public async deleteImage(data: ImageDeleteRequest): Promise<void> {
		return this.apiClient.delete<void>("/imagem", { data });
	}

	/**
	 * Step 4: Save technical configuration
	 */
	public async updateTechnical(
		productId: number,
		data: MusicalProductTechnicalConfig
	): Promise<void> {
		return this.apiClient.post<void>(
			`/produtomusical/onboarding/${productId}/configuracaoTecnica`,
			data
		);
	}

	/**
	 * Step 5: Save schedule
	 */
	public async updateSchedule(
		productId: number,
		data: MusicalProductSchedule
	): Promise<void> {
		return this.apiClient.post<void>(
			`/produtomusical/onboarding/${productId}/agenda`,
			data
		);
	}

	/**
	 * Get available schedule for a product
	 */
	public async getSchedule(
		productId: number
	): Promise<Array<ScheduleApiResponse>> {
		return this.apiClient.get(`/produtomusical/onboarding/${productId}/agenda`);
	}

	/**
	 * Step 6: Publish the product
	 */
	public async publish(productId: number): Promise<number> {
		return this.apiClient.post<number>(
			`/produtomusical/onboarding/${productId}/publicar`
		);
	}
}

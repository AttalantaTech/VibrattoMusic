import type { OnboardingContactData } from "@/utils/validation";
import type { ApiClient } from "../core/client";
import type {
	MusicalProductDetails,
	MusicalProductMedia,
	MusicalProductImages,
	MusicalProductTechnicalConfig,
	MusicalProductSchedule,
	ScheduleApiResponse,
	OnboardingApiResponse,
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
	 * Get available schedule for a product
	 */
	public async getSchedule(
		productId: number
	): Promise<Array<ScheduleApiResponse>> {
		return this.apiClient.get(`/produtomusical/onboarding/${productId}/agenda`);
	}

	/**
	 * Save onboarding contact information (Step 1)
	 */
	public async saveOnboardingContact(
		contactData: OnboardingContactData
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
		detailsData: MusicalProductDetails
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
		mediaData: MusicalProductMedia
	): Promise<void> {
		return this.apiClient.post<void>(
			`produtomusical/onboarding/${productId}/midias`,
			mediaData
		);
	}

	/**
	 * Save onboarding images (Step 3)
	 */
	public async saveOnboardingImages(
		productId: number,
		imagesData: MusicalProductImages
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
		technicalData: MusicalProductTechnicalConfig
	): Promise<void> {
		return this.apiClient.post<void>(
			`produtomusical/onboarding/${productId}/configuracaoTecnica`,
			technicalData
		);
	}

	/**
	 * Save onboarding schedule (Step 5)
	 */
	public async saveOnboardingSchedule(
		productId: number,
		scheduleData: MusicalProductSchedule
	): Promise<void> {
		return this.apiClient.post<void>(
			`produtomusical/onboarding/${productId}/agenda`,
			scheduleData
		);
	}

	/**
	 * Step 6: Publish the onboarding
	 */
	public async publishOnboarding(productId: number): Promise<number> {
		return this.apiClient.post<number>(
			`/produtomusical/onboarding/${productId}/publicar`
		);
	}

	/**
	 * Disable Onboarding
	 */
	public async disableOnboarding(onboardingId: number): Promise<void> {
		return this.apiClient.post<void>(
			`/produtomusical/onboarding/${onboardingId}/inativar`
		);
	}
}

import type {
	MusicalProductApiResponse,
	OnboardingApiResponse,
} from "@/api/types";

export function musicalProductMapper(
	data: MusicalProductApiResponse | null
): OnboardingApiResponse | null {
	return data
		? {
				etapaCadastro: 0,
				idCadastro: 0,
				...data,
			}
		: null;
}

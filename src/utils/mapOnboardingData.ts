import type { OnboardingApiResponse } from "@/api/types";
import { decryptValue } from "./encryptValue";

interface SearchParameters {
	type?: string | undefined;
	registerId?: string | undefined;
}

interface MapOnboardingData {
	searchParameters: SearchParameters;
	data: Array<OnboardingApiResponse> | undefined;
}

export const mapOnboardingData = ({
	searchParameters,
	data,
}: MapOnboardingData): OnboardingApiResponse | undefined => {
	if (!data?.length) return undefined;

	const { type, registerId } = searchParameters;

	if (type === "new-onboarding") return undefined;

	if (!registerId) return data[0];

	if (!data?.length) return undefined;

	const onboardingID = Number(decryptValue(registerId));

	return data.find((item) => item.id === onboardingID);
};

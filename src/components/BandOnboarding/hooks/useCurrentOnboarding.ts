import { useMemo } from "react";
import { useSearch } from "@tanstack/react-router";
import { useOnboardingData } from "@/hooks/useOnboarding";
import type { OnboardingApiResponse } from "@/api/types";
import { decryptValue } from "@/utils/encryptValue";

/**
 * The registration being filled in: the one in the URL (?registerId=), none
 * for a brand new one (?type=new-onboarding), or else the first pending one.
 * Its etapaCadastro is the progress saved on the server: a step is done
 * when etapaCadastro has gone past it.
 */
export const useCurrentOnboarding = () => {
	const { data, isFetching } = useOnboardingData();
	// All six step routes share these search params
	const { registerId, type } = useSearch({ strict: false });

	const onboardingData = useMemo<OnboardingApiResponse | undefined>(() => {
		if (!data?.length || type === "new-onboarding") return undefined;

		if (registerId) {
			const id = Number(decryptValue(registerId));
			return data.find((item) => item.id === id);
		}

		return data[0];
	}, [data, registerId, type]);

	const isStepDone = (step: number) =>
		(onboardingData?.etapaCadastro ?? 0) > step;

	return { onboardingData, isFetching, isStepDone };
};

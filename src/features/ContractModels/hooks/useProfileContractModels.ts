import type { ContractModel, ContractModelSummary } from "../types";
import { summariesOf, useDemoContractModels } from "./useDemoContractModels";

/**
 * The profile's contract models, for the proposal form. Demo source for now;
 * the API version (contractModelsApi.list/get) replaces it here only
 */
export const useProfileContractModels = (
	profileId: number | undefined
): {
	models: Array<ContractModelSummary>;
	/** The profile's default model, or null for Vibratto's contract */
	defaultId: number | null;
	getModel: (id: number) => ContractModel | undefined;
} => {
	const stored = useDemoContractModels((state) =>
		profileId ? state.byProfile[profileId] : undefined
	);
	const models = summariesOf(stored);

	return {
		models,
		defaultId: models.find((model) => model.padrao)?.id ?? null,
		getModel: (id) => stored?.find((model) => model.id === id),
	};
};

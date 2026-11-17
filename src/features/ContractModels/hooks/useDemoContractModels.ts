import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ContractModel, ContractModelSummary } from "../types";
import { DEMO_BASE_SECTIONS } from "../utils/demoBaseModel";

/**
 * DEMONSTRATION: the professional's models kept in this browser, in the
 * same shape as the API, until production has the base model
 */
interface DemoModel extends ContractModel {
	padrao: boolean;
}

interface DemoStore {
	byProfile: Record<number, Array<DemoModel>>;
	nextId: number;
	create: (profileId: number, nome: string) => number;
	update: (profileId: number, model: ContractModel) => void;
	setDefault: (profileId: number, modelId: number | null) => void;
	remove: (profileId: number, modelId: number) => void;
}

export const useDemoContractModels = create<DemoStore>()(
	persist(
		(set, get) => ({
			byProfile: {},
			nextId: 1000,
			create: (profileId, nome) => {
				const id = get().nextId;
				const models = get().byProfile[profileId] ?? [];
				const sections = DEMO_BASE_SECTIONS.map((section, index) => ({
					...section,
					id: id * 100 + index,
				}));
				set({
					nextId: id + 1,
					byProfile: {
						...get().byProfile,
						[profileId]: [
							...models,
							{ id, nome: nome.trim(), padrao: false, secoes: sections },
						],
					},
				});
				return id;
			},
			update: (profileId, model) => {
				set((state) => ({
					byProfile: {
						...state.byProfile,
						[profileId]: (state.byProfile[profileId] ?? []).map((item) =>
							item.id === model.id ? { ...item, ...model } : item
						),
					},
				}));
			},
			setDefault: (profileId, modelId) => {
				set((state) => ({
					byProfile: {
						...state.byProfile,
						[profileId]: (state.byProfile[profileId] ?? []).map((item) => ({
							...item,
							padrao: item.id === modelId,
						})),
					},
				}));
			},
			remove: (profileId, modelId) => {
				set((state) => ({
					byProfile: {
						...state.byProfile,
						[profileId]: (state.byProfile[profileId] ?? []).filter(
							(item) => item.id !== modelId
						),
					},
				}));
			},
		}),
		{ name: "vibratto-contract-models-demo" }
	)
);

export const summariesOf = (
	models: Array<DemoModel> | undefined
): Array<ContractModelSummary> =>
	(models ?? []).map(({ id, nome, padrao }) => ({ id, nome, padrao }));

/** The base contract, as a model, for "Ver contrato padrão" */
export const DEMO_BASE_MODEL: ContractModel = {
	id: 0,
	nome: "Contrato padrão da Vibratto",
	secoes: DEMO_BASE_SECTIONS,
};

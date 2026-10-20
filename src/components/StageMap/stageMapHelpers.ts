import z from "zod";
import type { FilterOptionInstrument } from "@/api/types";
import type { StageElement, StageMapData } from "./types";
import { STAGE_COLORS, STAGE_ELEMENT_SIZE } from "./types";

// Keeps a size inside the allowed range; maps saved before resizing have no size
export const clampElementSize = (size?: number | null) => {
	if (!size) return STAGE_ELEMENT_SIZE.DEFAULT;
	return Math.min(
		STAGE_ELEMENT_SIZE.MAX,
		Math.max(STAGE_ELEMENT_SIZE.MIN, size)
	);
};

// Builds a stage element from an instrument of the catalog
export const createStageElement = (
	instrument: FilterOptionInstrument,
	overrides: Partial<StageElement> = {}
): StageElement => {
	const isInstrument = instrument.IdTipoEquipamento === 1;

	return {
		id: `api-instrument-${instrument.Id}`,
		name: instrument.Nome,
		x: 0,
		y: 0,
		icon: instrument.Icone,
		category: isInstrument ? "instrument" : "infrastructure",
		color: isInstrument ? STAGE_COLORS.instrument : STAGE_COLORS.infrastructure,
		instrumentId: instrument.Id,
		instrumentName: instrument.Nome,
		idTipoEquipamento: instrument.IdTipoEquipamento,
		width: STAGE_ELEMENT_SIZE.DEFAULT,
		height: STAGE_ELEMENT_SIZE.DEFAULT,
		...overrides,
	};
};

// API → screen: saved map items become stage elements
export const convertStageMapDataToElements = (
	stageMapData: Array<StageMapData>,
	instrumentsData: Array<FilterOptionInstrument>
): Array<StageElement> =>
	stageMapData.flatMap((item, index) => {
		const instrument = instrumentsData.find(
			(option) => option.Id === item.idInstrumento
		);
		if (!instrument) return [];

		const size = clampElementSize(item.tamanho);

		return [
			createStageElement(instrument, {
				id: `saved-element-${item.idInstrumento}-${index}`,
				x: item.posicaoX,
				y: item.posicaoY,
				width: size,
				height: size,
			}),
		];
	});

// Screen → API: stage elements become the payload saved by the backend
export const convertElementsToStageMapData = (
	elements: Array<StageElement>
): Array<StageMapData> =>
	elements.flatMap((element) =>
		element.instrumentId
			? [
					{
						idInstrumento: element.instrumentId,
						posicaoX: element.x,
						posicaoY: element.y,
						tamanho: element.width,
					},
				]
			: []
	);

// Form validation of one map item. Without "tamanho" here, zod would
// silently drop the field before the request
export const stageMapItemSchema = z.object({
	idInstrumento: z.number(),
	posicaoX: z.number(),
	posicaoY: z.number(),
	tamanho: z.number().nullable().optional(),
});

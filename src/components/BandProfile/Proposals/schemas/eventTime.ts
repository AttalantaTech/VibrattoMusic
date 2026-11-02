import { z } from "zod";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

const TIME_FIELDS = [
	{ key: "horaInicio", required: "Hora de início é obrigatória" },
	{ key: "duracao", required: "Duração é obrigatória" },
] as const;

type EventTimeFields = {
	definirHorarioEvento?: boolean;
	horaInicio: string;
	duracao: string | null;
};

/**
 * "Definir horário e duração" checked: the start time and the duration are
 * required (a proposal saves start and end, so the end needs both). Shared by
 * the availability check and the proposal forms
 */
export const addEventTimeIssues = (
	data: EventTimeFields,
	context: z.RefinementCtx
) => {
	if (!data.definirHorarioEvento) return;

	TIME_FIELDS.forEach(({ key, required }) => {
		const value = data[key]?.trim();
		if (!value) {
			context.addIssue({
				path: [key],
				message: required,
				code: z.ZodIssueCode.custom,
			});
		} else if (!TIME_PATTERN.test(value)) {
			context.addIssue({
				path: [key],
				message: "Formato de hora inválido",
				code: z.ZodIssueCode.custom,
			});
		}
	});
};

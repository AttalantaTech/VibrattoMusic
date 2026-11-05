import { z } from "zod";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

/**
 * Event time on the availability check and the proposal: the duration is
 * always required (the band needs the length of the event to quote); the
 * start time is optional, checked only when filled in
 */
export const eventTimeFields = {
	horaInicio: z
		.string()
		.refine(
			(value) => !value.trim() || TIME_PATTERN.test(value.trim()),
			"Formato de hora inválido"
		),
	duracao: z
		.string()
		.nullable()
		.refine((value) => !!value?.trim(), "Duração é obrigatória")
		.refine(
			(value) => !value?.trim() || TIME_PATTERN.test(value.trim()),
			"Formato de hora inválido"
		),
};

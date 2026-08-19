import z from "zod";

const checkAvailabilityValidationSchema = z
	.object({
		idTipoEvento: z.number().min(1, "Tipo de evento é obrigatório"),
		descricao: z.string().optional(),
		local: z.string().trim().min(3, "Local é obrigatório"),
		definirHorarioEvento: z.boolean().optional(),
		dataEvento: z.string().min(1, "Data do Evento é obrigatória"),
		horaInicio: z.string(),
		duracao: z.string().nullable(),
	})
	.superRefine((data, context) => {
		if (!data.definirHorarioEvento) return;

		const requiredFields = [
			{ key: "horaInicio", label: "Hora de início" },
			{ key: "duracao", label: "Duração" },
		] as const;

		const patternTime = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

		requiredFields.forEach(({ key, label }) => {
			if (!data[key] || data[key]?.trim() === "") {
				context.addIssue({
					path: [key],
					message: `${label} é obrigatório`,
					code: z.ZodIssueCode.custom,
				});
			}

			if (data[key] && !patternTime.test(data[key])) {
				context.addIssue({
					path: [key],
					message: "Formato de hora inválido",
					code: z.ZodIssueCode.custom,
				});
			}
		});
	});

type CheckAvailabilityForm = z.infer<typeof checkAvailabilityValidationSchema>;

export type { CheckAvailabilityForm };
export { checkAvailabilityValidationSchema };

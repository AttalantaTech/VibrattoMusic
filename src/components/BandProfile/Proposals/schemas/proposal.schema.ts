import { z } from "zod";

export const createProposalSchema = z
	.object({
		idContratante: z.number().optional(),
		nomeContratante: z.string().optional(),
		idTipoEvento: z.number().min(1, "Tipo de evento é obrigatório"),
		descricao: z.string().optional(),
		valor: z.number().min(0.01, "Valor deve ser maior que zero"),
		local: z.string().trim().min(3, "Local é obrigatório"),
		definirHorarioEvento: z.boolean().optional(),
		dataInicio: z.string().min(1, "Data de início é obrigatória"),
		dataFim: z.string().nullable(),
		horaInicio: z.string().nullable(),
		horaFim: z.string().nullable(),
		transporteIncluso: z.boolean().optional(),
		acomodacaoInclusa: z.boolean().optional(),
		formaPagamento: z
			.array(z.number().min(1))
			.min(1, "O campo Forma de Pagamento é obrigatório."),
		idCondicoesPagamento: z
			.number()
			.min(1, "O campo Condição de Pagamento é obrigatório."),
	})
	.superRefine((data, context) => {
		if (!data.definirHorarioEvento) return;

		const requiredFields = [
			{ key: "horaInicio", label: "Hora de início" },
			{ key: "horaFim", label: "Hora de Fim" },
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

export type CreateProposalSchema = z.infer<typeof createProposalSchema>;

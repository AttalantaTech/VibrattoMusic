import { z } from "zod";

const createProposalSchema = z
	.object({
		idContratante: z.number().optional(),
		nomeContratante: z.string().optional(),
		idTipoEvento: z.number().min(1, "Tipo de evento é obrigatório"),
		descricao: z.string().optional(),
		valor: z.number().min(0.01, "Valor deve ser maior que zero"),
		local: z.string().trim().min(3, "Local é obrigatório"),
		definirHorarioEvento: z.boolean().optional(),
		dataVencimentoSinalPagamento: z.coerce
			.number({
				errorMap: (issue, context) => {
					if (issue.code === "invalid_type" || isNaN(Number(context.data))) {
						return {
							message: "Data de vencimento do pagamento do Sinal é obrigatória",
						};
					}
					return { message: context.defaultError };
				},
			})
			.min(1, "Data de vencimento do pagamento do Sinal é obrigatória"),
		dataVencimentoAceite: z
			.number({
				errorMap: (issue, context) => {
					if (issue.code === "invalid_type" || isNaN(Number(context.data))) {
						return {
							message: "Data de vencimento Aceite é obrigatória",
						};
					}
					return { message: context.defaultError };
				},
			})
			.min(1, "Data de vencimento Aceite é obrigatória"),
		dataEvento: z.string().min(1, "Data do Evento é obrigatória"),
		horaInicio: z.string(),
		duracao: z.string().nullable(),
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

export type CreateProposalForm = z.infer<typeof createProposalSchema>;
export { createProposalSchema };

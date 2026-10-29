import { z } from "zod";
import {
	PAYMENT_CONDITION,
	requiresDownPayment,
} from "../utils/calculateSignal";

const createProposalSchema = z
	.object({
		idContratante: z.number().optional(),
		nomeContratante: z.string().optional(),
		idTipoEvento: z.number().min(1, "Tipo de evento é obrigatório"),
		descricao: z.string().optional(),
		valor: z.number().min(0.01, "Valor deve ser maior que zero"),
		local: z.string().trim().min(3, "Local é obrigatório"),
		definirHorarioEvento: z.boolean().optional(),
		// Required only when the condition has a down payment (see superRefine);
		// a cleared field becomes 0 instead of failing while it's hidden
		dataVencimentoSinalPagamento: z.coerce.number().catch(0),
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
		tipoSinalPagamento: z.enum(["V", "P"]).nullable(),
		valorSinalPagamento: z.number(),
		camarimIncluso: z.boolean().optional(),
		estruturaPalcoSomIluminacaoInclusa: z.boolean().optional(),
		geradorIncluso: z.boolean().optional(),
		formaPagamento: z
			.array(z.number().min(1))
			.min(1, "O campo Forma de Pagamento é obrigatório."),
		idCondicoesPagamento: z
			.number()
			.min(1, "O campo Condição de Pagamento é obrigatório."),
		idOrcamento: z.number().optional().nullable(),
		idPropostaGerouContraProposta: z.number().optional().nullable(),
	})

	.superRefine((data, context) => {
		if (
			requiresDownPayment(data.idCondicoesPagamento) &&
			!(data.dataVencimentoSinalPagamento >= 1)
		) {
			context.addIssue({
				path: ["dataVencimentoSinalPagamento"],
				code: z.ZodIssueCode.custom,
				message: "Data de vencimento do pagamento do Sinal é obrigatória",
			});
		}

		if (data.idCondicoesPagamento === PAYMENT_CONDITION.SIGNAL_CUSTOM) {
			if (!data.valorSinalPagamento || data.valorSinalPagamento <= 0) {
				context.addIssue({
					path: ["valorSinalPagamento"],
					code: z.ZodIssueCode.custom,
					message: "Informe o valor do sinal",
				});
			} else if (data.valorSinalPagamento > data.valor) {
				context.addIssue({
					path: ["valorSinalPagamento"],
					code: z.ZodIssueCode.custom,
					message: "O sinal deve ser menor que o valor total",
				});
			}
		}

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

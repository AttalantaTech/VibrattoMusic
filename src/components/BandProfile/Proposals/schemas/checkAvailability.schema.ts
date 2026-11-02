import z from "zod";
import { addEventTimeIssues } from "./eventTime";

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
	.superRefine(addEventTimeIssues);

type CheckAvailabilityForm = z.infer<typeof checkAvailabilityValidationSchema>;

export type { CheckAvailabilityForm };
export { checkAvailabilityValidationSchema };

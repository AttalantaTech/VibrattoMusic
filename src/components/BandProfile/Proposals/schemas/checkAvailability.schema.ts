import z from "zod";
import { eventTimeFields } from "./eventTime";

const checkAvailabilityValidationSchema = z.object({
	idTipoEvento: z.number().min(1, "Tipo de evento é obrigatório"),
	descricao: z.string().optional(),
	local: z.string().trim().min(3, "Local é obrigatório"),
	dataEvento: z.string().min(1, "Data do Evento é obrigatória"),
	...eventTimeFields,
});

type CheckAvailabilityForm = z.infer<typeof checkAvailabilityValidationSchema>;

export type { CheckAvailabilityForm };
export { checkAvailabilityValidationSchema };

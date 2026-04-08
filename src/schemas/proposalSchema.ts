import { z } from "zod";

export const createProposalSchema = z.object({
	idConversa: z.number().min(1, "ID da conversa é obrigatório"),
	nomeContratante: z.string().min(1, "O campo Nome Contratante é obrigatório."),
	idProdutoMusical: z.number().min(1, "Produto musical é obrigatório"),
	idTipoEvento: z.number().min(1, "Tipo de evento é obrigatório"),
	descricao: z.string().trim().min(10, "Descrição deve ter pelo menos 10 caracteres"),
	valor: z.number().min(0.01, "Valor deve ser maior que zero"),
	local: z.string().min(5, "Local é obrigatório"),
	dataInicio: z.string().min(1, "Data de início é obrigatória"),
	dataFim: z.string().min(1, "Data de fim é obrigatória"),
	horaInicio: z
		.string()
		.min(1, "Hora de início é obrigatória")
		.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Formato de hora inválido"),
	horaFim: z
		.string()
		.min(1, "Hora de fim é obrigatória")
		.regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, "Formato de hora inválido"),
	idFormaPagamento: z.number().min(1, "O campo Forma de Pagamento é obrigatório."),
	idCondicoesPagamento: z
		.number()
		.min(1, "O campo Condição de Pagamento é obrigatório."),
	idCondicoesPagamentoRestante: z.number().nullable().optional(),
	tipoSinalPagamento: z.enum(["P", "V"]).nullable().optional(),
	valorSinalPagamento: z.number().nullable().optional(),
	dataVencimentoSinalPagamento: z.string().nullable().optional(),
	transporteIncluso: z.boolean().optional(),
	acomodacaoInclusa: z.boolean().optional(),
	camarimIncluso: z.boolean().optional(),
});

export type CreateProposalSchema = z.infer<typeof createProposalSchema>;

// Custom validation for dates
export const validateProposalDates = (
	dataInicio: string,
	dataFim: string
): boolean => {
	// Handle both YYYY-MM-DD and YYYY-MM-DDTHH:mm:ss formats
	const parseDate = (dateString: string): Date => {
		// If it contains 'T', it's already in ISO format
		if (dateString.includes('T')) {
			return new Date(dateString);
		}
		// Otherwise, assume it's YYYY-MM-DD format
		return new Date(`${dateString}T00:00:00`);
	};

	const startDate = parseDate(dataInicio);
	const endDate = parseDate(dataFim);
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Check if dates are valid
	if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
		return false;
	}

	// Check if start date is not in the past
	if (startDate < today) {
		return false;
	}

	// Check if end date is not before start date
	if (endDate < startDate) {
		return false;
	}

	return true;
};

// Custom validation for times
export const validateProposalTimes = (
	horaInicio: string,
	horaFim: string,
	dataInicio: string,
	dataFim: string
): boolean => {
	// If event is on the same day, check that end time is after start time
	if (dataInicio === dataFim) {
		const startParts = horaInicio.split(":");
		const endParts = horaFim.split(":");
		
		// Accept both HH:MM and HH:MM:SS formats
		if (startParts.length < 2 || endParts.length < 2 || 
			startParts.length > 3 || endParts.length > 3) {
			return false;
		}
		
		const [startHour, startMinute] = startParts.map(Number);
		const [endHour, endMinute] = endParts.map(Number);
		
		if (startHour === undefined || startMinute === undefined || endHour === undefined || endMinute === undefined ||
			isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) {
			return false;
		}

		const startMinutes = startHour * 60 + startMinute;
		const endMinutes = endHour * 60 + endMinute;

		return endMinutes > startMinutes;
	}

	return true;
};
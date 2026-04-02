import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Utility functions for CPF/CNPJ validation
export const validateCPF = (cpf: string): boolean => {
	const cleaned = cpf.replace(/\D/g, "");

	if (cleaned.length !== 11) return false;
	if (/^(\d)\1{10}$/.test(cleaned)) return false; // All same digits
	// Validate first check digit
	let sum = 0;
	for (let index = 0; index < 9; index++) {
		sum += parseInt(cleaned.charAt(index)) * (10 - index);
	}
	let remainder = 11 - (sum % 11);
	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== parseInt(cleaned.charAt(9))) return false;

	// Validate second check digit
	sum = 0;
	for (let index = 0; index < 10; index++) {
		sum += parseInt(cleaned.charAt(index)) * (11 - index);
	}
	remainder = 11 - (sum % 11);
	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== parseInt(cleaned.charAt(10))) return false;

	return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
	const cleaned = cnpj.replace(/\D/g, "");

	if (cleaned.length !== 14) return false;
	if (/^(\d)\1{13}$/.test(cleaned)) return false; // All same digits
	// Validate first check digit
	let sum = 0;
	let weight = 2;
	for (let index = 11; index >= 0; index--) {
		sum += parseInt(cleaned.charAt(index)) * weight;
		weight = weight === 9 ? 2 : weight + 1;
	}
	let remainder = sum % 11;
	const digit1 = remainder < 2 ? 0 : 11 - remainder;
	if (digit1 !== parseInt(cleaned.charAt(12))) return false;

	// Validate second check digit
	sum = 0;
	weight = 2;
	for (let index = 12; index >= 0; index--) {
		sum += parseInt(cleaned.charAt(index)) * weight;
		weight = weight === 9 ? 2 : weight + 1;
	}
	remainder = sum % 11;
	const digit2 = remainder < 2 ? 0 : 11 - remainder;
	if (digit2 !== parseInt(cleaned.charAt(13))) return false;

	return true;
};

// Enhanced validation schemas
export const ContactValidationSchema = z
	.object({
		usaCnpj: z.boolean().default(false),

		nome: z.string().optional(),

		cnpj: z
			.string()
			.optional()
			.refine((value) => {
				if (!value) return true;
				return validateCNPJ(value);
			}, "CNPJ inválido"),

		cpf: z
			.string()
			.optional()
			.refine((value) => {
				if (!value) return true;
				return validateCPF(value);
			}, "CPF inválido"),

		razaoSocial: z.string().optional(),

		telefone: z
			.string()
			.optional()
			.refine((value) => {
				if (!value) return true;
				const cleaned = value.replace(/\D/g, "");
				return cleaned.length >= 10 && cleaned.length <= 11;
			}, "Telefone inválido"),

		cepContato: z
			.string()
			.optional()
			.refine((value) => {
				if (!value) return true;
				return /^\d{8}$/.test(value.replace(/\D/g, ""));
			}, "CEP inválido"),

		logradouroContato: z.string().max(200, "Logradouro muito longo").optional(),
		numeroContato: z.string().max(10, "Número muito longo").optional(),
		bairroContato: z.string().max(100, "Bairro muito longo").optional(),
		cidadeContato: z.string().max(100, "Cidade muito longa").optional(),

		estadoContato: z
			.string()
			.optional()
			.refine((value) => {
				if (!value) return true;
				return /^[A-Z]{2}$/.test(value);
			}, "Estado deve ser em maiúsculas (ex: SP)"),

		complementoContato: z
			.string()
			.max(100, "Complemento muito longo")
			.optional(),
	})
	.superRefine((data, context) => {
		if (!data.usaCnpj) return;

		const requiredFields = [
			{ key: "cnpj", label: "CNPJ" },
			{ key: "nome", label: "Nome" },
			{ key: "razaoSocial", label: "Razão social" },
			{ key: "telefone", label: "Telefone" },
			{ key: "cepContato", label: "CEP" },
			{ key: "logradouroContato", label: "Logradouro" },
			{ key: "numeroContato", label: "Número" },
			{ key: "bairroContato", label: "Bairro" },
			{ key: "cidadeContato", label: "Cidade" },
			{ key: "estadoContato", label: "Estado" },
		] as const;

		requiredFields.forEach(({ key, label }) => {
			if (!data[key] || data[key]?.trim() === "") {
				context.addIssue({
					path: [key],
					message: `${label} é obrigatório`,
					code: z.ZodIssueCode.custom,
				});
			}
		});
	});

export const DetailsValidationSchema = z.object({
	nome: z
		.string()
		.min(2, "Nome artístico deve ter pelo menos 2 caracteres")
		.max(100, "Nome artístico muito longo"),
	idCategoria: z
		.number()
		.min(1, "Categoria é obrigatória")
		.int("Categoria deve ser um número inteiro"),
	descricao: z
		.string()
		.min(10, "Descrição deve ter pelo menos 10 caracteres")
		.max(500, "Descrição deve ter no máximo 500 caracteres"),
	podeDeslocamento: z.boolean().default(false),
	codigoMunicipio: z
		.number()
		.min(1, "Cidade é obrigatória")
		.int("Código do município deve ser um número inteiro"),
	tipoEvento: z
		.array(z.number())
		.min(1, "Selecione pelo menos um tipo de evento")
		.max(10, "Máximo 10 tipos de evento"),
	generoMusical: z
		.array(z.number())
		.min(1, "Selecione pelo menos um gênero musical")
		.max(10, "Máximo 10 gêneros musicais"),
	tipoProducao: z
		.array(z.number())
		.max(10, "Máximo 10 tipos de produção")
		.optional(),
});

export const MediaValidationSchema = z.object({
	videosYouTube: z
		.array(z.string().url("URL inválida"))
		.max(5, "Máximo 5 vídeos do YouTube")
		.optional(),
	spotifyPlaylistId: z
		.string()
		.max(100, "ID da playlist muito longo")
		.optional(),
	exibirValorServico: z.boolean().default(false),
	valorServico: z
		.number()
		.min(0, "Valor não pode ser negativo")
		.max(1000000, "Valor muito alto")
		.optional(),
	redeSocial: z
		.array(
			z.object({
				idRedeSocial: z.number().int("ID deve ser um número inteiro"),
				link: z.string().url("URL inválida").max(500, "URL muito longa"),
			})
		)
		.max(10, "Máximo 10 redes sociais")
		.optional(),
});

export const ImagesValidationSchema = z.object({
	fotoPerfil: z.string().url("URL inválida").optional(),
	logomarca: z.string().url("URL inválida").optional(),
	imagensCarrossel: z
		.array(z.string().url("URL inválida"))
		.max(10, "Máximo 10 imagens no carrossel")
		.optional(),
});

export const TechnicalValidationSchema = z.object({
	rider: z.string().max(500, "URL do rider muito longa").optional(),
	infraCamarim: z
		.string()
		.max(500, "URL da infraestrutura muito longa")
		.optional(),
	camarimIncluso: z.boolean().default(false),
	mapaPalco: z
		.array(
			z.object({
				idInstrumento: z
					.number()
					.int("ID do instrumento deve ser um número inteiro"),
				posicaoX: z
					.number()
					.min(0)
					.max(100, "Posição X deve estar entre 0 e 100"),
				posicaoY: z
					.number()
					.min(0)
					.max(100, "Posição Y deve estar entre 0 e 100"),
			})
		)
		.max(20, "Máximo 20 instrumentos no mapa")
		.optional(),
});

export const ScheduleValidationSchema = z
	.object({
		compromissos: z
			.array(
				z.object({
					data: z.string().refine((value) => {
						const date = new Date(value);
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						return date >= today;
					}, "Data não pode ser anterior a hoje"),
					horaInicio: z.string().refine((value) => {
						return /^([0-1]?\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value);
					}, "Formato de hora inválido (HH:mm:ss)"),
					horaFim: z.string().refine((value) => {
						return /^([0-1]?\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(value);
					}, "Formato de hora inválido (HH:mm:ss)"),
					disponibilidadeOutrosEventos: z.boolean().default(false),
					titulo: z
						.string()
						.min(1, "Título é obrigatório")
						.max(100, "Título muito longo"),
					descricao: z.string().max(500, "Descrição muito longa").optional(),
				})
			)
			.optional(),
	})
	.refine(
		(data) => {
			// Validate that end time is after start time for each commitment
			if (!data.compromissos) return true;
			return data.compromissos.every((compromisso) => {
				const startParts = compromisso.horaInicio.split(":");
				const endParts = compromisso.horaFim.split(":");

				if (startParts.length !== 3 || endParts.length !== 3) return false;

				const startHour = parseInt(startParts[0] || "0", 10);
				const startMin = parseInt(startParts[1] || "0", 10);
				const endHour = parseInt(endParts[0] || "0", 10);
				const endMin = parseInt(endParts[1] || "0", 10);

				if (
					isNaN(startHour) ||
					isNaN(startMin) ||
					isNaN(endHour) ||
					isNaN(endMin)
				)
					return false;

				const startMinutes = startHour * 60 + startMin;
				const endMinutes = endHour * 60 + endMin;
				return endMinutes > startMinutes;
			});
		},
		{
			message: "Hora de fim deve ser posterior à hora de início",
			path: ["compromissos"],
		}
	);

// File validation helpers
export const validateImageFile = (
	file: File
): { valid: boolean; error?: string } => {
	const validTypes = ["image/jpeg", "image/jpg", "image/png"];
	const maxSize = 5 * 1024 * 1024; // 5MB

	if (!validTypes.includes(file.type)) {
		return {
			valid: false,
			error: "Tipo de arquivo inválido. Use JPG, JPEG ou PNG.",
		};
	}

	if (file.size > maxSize) {
		return {
			valid: false,
			error: "Arquivo muito grande. Tamanho máximo: 5MB.",
		};
	}

	return { valid: true };
};

export const validatePDFFile = (
	file: File
): { valid: boolean; error?: string } => {
	const maxSize = 10 * 1024 * 1024; // 10MB

	if (file.type !== "application/pdf") {
		return { valid: false, error: "Apenas arquivos PDF são permitidos." };
	}

	if (file.size > maxSize) {
		return {
			valid: false,
			error: "Arquivo muito grande. Tamanho máximo: 10MB.",
		};
	}

	return { valid: true };
};

// Currency formatting
export const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
};

export const formatDate = (dateString: string): string => {
	try {
		return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", {
			locale: ptBR,
		});
	} catch {
		return dateString;
	}
};

export const parseCurrency = (value: string): number => {
	const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
	return parseFloat(cleaned) || 0;
};

export type OnboardingContactData = z.infer<typeof ContactValidationSchema> & {
	id: number;
	email?: string;
};

export const isPdfFile = (link: string): boolean => {
	const regex = /\.pdf$/i;

	return regex.test(link);
};

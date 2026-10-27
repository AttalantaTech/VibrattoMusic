import { validateAlphanumericCNPJ, validateCPF } from "@/utils/validation";
import z from "zod";
import {
	PERSONAL_DATA_MESSAGE,
	containsPersonalData,
	passwordSchema,
} from "@/utils/password";

export const registerSchema = z
	.object({
		email: z.string().email("Email inválido"),
		nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
		tipoDocumento: z.enum(["cpf", "cnpj"]),
		cpfOuCnpj: z.string(),
		nomeResponsavelLegal: z.string().trim(),
		cpfResponsavelLegal: z.string(),

		celular: z.string().min(13, "Celular é obrigatório"),
		cep: z
			.string()
			.refine(
				(value) => value.replace(/\D/g, "").length === 8,
				"CEP deve ter 8 dígitos"
			),
		logradouro: z.string().min(1, "Logradouro é obrigatório"),
		bairro: z.string().min(1, "Bairro é obrigatório"),
		cidade: z.string().min(1, "Cidade é obrigatória"),
		estado: z.string().min(1, "Estado é obrigatório"),
		numero: z.string().min(1, "Número é obrigatório"),
		complemento: z.string().optional(),
		senha: passwordSchema,
		confirmarSenha: z.string(),
	})
	.refine((data) => data.senha === data.confirmarSenha, {
		message: "As senhas não coincidem",
		path: ["confirmarSenha"],
	})
	.superRefine((data, context) => {
		if (containsPersonalData(data.senha, [data.email, data.nome])) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["senha"],
				message: PERSONAL_DATA_MESSAGE,
			});
		}

		if (data.tipoDocumento === "cpf") {
			if (!validateCPF(data.cpfOuCnpj)) {
				context.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["cpfOuCnpj"],
					message: "CPF inválido",
				});
			}
			return;
		}
		if (!validateAlphanumericCNPJ(data.cpfOuCnpj)) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["cpfOuCnpj"],
				message: "CNPJ inválido",
			});
		}
		if (data.nomeResponsavelLegal.length < 2) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["nomeResponsavelLegal"],
				message: "Informe o nome do responsável legal",
			});
		}
		if (!validateCPF(data.cpfResponsavelLegal)) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["cpfResponsavelLegal"],
				message: "CPF do responsável legal inválido",
			});
		}
	});

export type RegisterFormData = z.infer<typeof registerSchema>;

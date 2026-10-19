import z from "zod";
import {
	onlyAlphanumeric,
	onlyDigits,
	validateAlphanumericCNPJ,
	validateCPF,
} from "@/utils/validation";

export type DocumentType = "cpf" | "cnpj";

export const getDocumentType = (value?: string | null): DocumentType =>
	onlyAlphanumeric(value ?? "").length === 14 ? "cnpj" : "cpf";

const requiredText = (message: string) => z.string().trim().min(1, message);

export const profileSettingsSchema = z
	.object({
		nome: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres"),
		celular: z
			.string()
			.refine(
				(value) => onlyDigits(value).length === 11,
				"Informe o WhatsApp com DDD (11 dígitos)"
			),
		tipoDocumento: z.enum(["cpf", "cnpj"]),
		cpfOuCnpj: z.string(),
		nomeResponsavelLegal: z.string().trim(),
		cpfResponsavelLegal: z.string(),
		cep: z
			.string()
			.refine((value) => onlyDigits(value).length === 8, "CEP inválido"),
		logradouro: requiredText("Logradouro é obrigatório"),
		numero: requiredText("Número é obrigatório"),
		complemento: z.string().trim(),
		bairro: requiredText("Bairro é obrigatório"),
		cidade: requiredText("Cidade é obrigatória"),
		estado: z.string().trim().length(2, "Use a sigla do estado (ex.: SP)"),
	})
	.superRefine((data, context) => {
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

		// Legal representative only applies to companies (CNPJ)
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

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;

export const changePasswordSchema = z
	.object({
		senhaAtual: z.string().min(1, "Informe sua senha atual"),
		novaSenha: z
			.string()
			.min(6, "A nova senha deve ter pelo menos 6 caracteres"),
		confirmarSenha: z.string(),
	})
	.refine((data) => data.novaSenha === data.confirmarSenha, {
		message: "As senhas não coincidem",
		path: ["confirmarSenha"],
	})
	.refine((data) => data.novaSenha !== data.senhaAtual, {
		message: "A nova senha deve ser diferente da atual",
		path: ["novaSenha"],
	});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

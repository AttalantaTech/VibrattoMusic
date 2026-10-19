import { validateAlphanumericCNPJ, validateCPF } from "@/utils/validation";
import z from "zod";

export const registerSchema = z
	.object({
		email: z.string().email("Email inválido"),
		nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
		tipoDocumento: z.enum(["cpf", "cnpj"]),
		cpfOuCnpj: z.string(),
		nomeResponsavelLegal: z.string().trim(),
		cpfResponsavelLegal: z.string(),

		celular: z.string().min(13, "celular é obrigatório"),
		cep: z
			.string()
			.min(8, "CEP deve ter no mínimo 6 dígitos")
			.max(9, "CEP deve ter no máximo 9 dígitos"),
		logradouro: z.string().min(1, "Logradouro é obrigatório"),
		bairro: z.string().min(1, "Bairro é obrigatório"),
		cidade: z.string().min(1, "Cidade é obrigatória"),
		estado: z.string().min(1, "Estado é obrigatório"),
		numero: z.string().min(1, "Número é obrigatório"),
		complemento: z.string().optional(),
		senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
		confirmarSenha: z.string(),
	})
	.refine((data) => data.senha === data.confirmarSenha, {
		message: "As senhas não coincidem",
		path: ["confirmarSenha"],
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

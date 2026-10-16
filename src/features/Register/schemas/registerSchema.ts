import z from "zod";

export const registerSchema = z
	.object({
		email: z.string().email("Email inválido"),
		nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
		cpfOuCnpj: z.string().min(1, "Documento é obrigatório"),
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
	.refine(
		(data) => {
			const digitsOnly = data.cpfOuCnpj.replace(/\D/g, "");
			return digitsOnly.length === 11 || digitsOnly.length === 14;
		},
		{
			message: "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos",
			path: ["cpfOuCnpj"],
		}
	);

export type RegisterFormData = z.infer<typeof registerSchema>;

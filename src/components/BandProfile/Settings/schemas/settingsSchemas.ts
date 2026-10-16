import z from "zod";
import { validateAlphanumericCNPJ, validateCPF } from "@/utils/validation";

export const PHONE_MASK = "00 00000-0000";
export const CPF_MASK = "000.000.000-00";
export const CEP_MASK = "00000-000";
// "#" accepts letters or digits: alphanumeric CNPJ (Receita Federal, July 2026).
// Passed as a dynamic mask so the custom definition and uppercase go together
export const CNPJ_MASK = [
	{
		mask: "##.###.###/####-00",
		definitions: { "#": /[0-9A-Za-z]/ },
		prepareChar: (char: string) => char.toUpperCase(),
	},
];

export type DocumentType = "cpf" | "cnpj";

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

// Keeps letters: an alphanumeric CNPJ must not lose them
export const onlyAlphanumeric = (value: string) =>
	value.replace(/[^0-9A-Za-z]/g, "").toUpperCase();

// Formats raw API values ("11987456622") the same way the input masks display
// them, so the form does not look "changed" right after loading
const formatWithPattern = (raw: string, pattern: string) => {
	const size = pattern.split("").filter((char) => char === "#").length;
	if (raw.length !== size) return raw;

	let position = 0;
	return pattern.replace(/#/g, () => raw[position++] ?? "");
};

export const formatPhone = (value?: string | null) =>
	formatWithPattern(onlyDigits(value ?? ""), "## #####-####");

export const formatCep = (value?: string | null) =>
	formatWithPattern(onlyDigits(value ?? ""), "#####-###");

export const formatCpf = (value?: string | null) =>
	formatWithPattern(onlyDigits(value ?? ""), "###.###.###-##");

export const formatDocument = (value?: string | null) => {
	const raw = onlyAlphanumeric(value ?? "");
	return raw.length === 14
		? formatWithPattern(raw, "##.###.###/####-##")
		: formatCpf(raw);
};

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

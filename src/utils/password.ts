import z from "zod";

// Password policy for NEW passwords (register, change and reset).
// Login must NOT use it: users with older, weaker passwords still need to sign in.
// The backend must enforce the same rules; this file only guides the user.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

export interface PasswordRule {
	id: string;
	label: string;
	test: (password: string) => boolean;
}

// Rules shown as a live checklist while the user types
export const PASSWORD_RULES: Array<PasswordRule> = [
	{
		id: "length",
		label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
		test: (password) => password.length >= PASSWORD_MIN_LENGTH,
	},
	{
		id: "uppercase",
		label: "Uma letra maiúscula",
		test: (password) => /[A-Z]/.test(password),
	},
	{
		id: "lowercase",
		label: "Uma letra minúscula",
		test: (password) => /[a-z]/.test(password),
	},
	{
		id: "number",
		label: "Um número",
		test: (password) => /\d/.test(password),
	},
	{
		id: "special",
		label: "Um caractere especial (!@#$%...)",
		test: (password) => /[^A-Za-z0-9\s]/.test(password),
	},
];

// Passwords that pass the rules but are the first ones an attacker tries.
// Compared ignoring case, accents and the special characters/numbers at the end
const COMMON_PASSWORD_BASES = [
	"senha",
	"password",
	"mudar",
	"mudar123",
	"vibratto",
	"admin",
	"brasil",
	"qwerty",
	"abc",
	"abcd",
	"teste",
	"usuario",
	"bemvindo",
	"welcome",
	"musica",
	"banda",
	"show",
	"iloveyou",
	"amor",
	"deus",
	"jesus",
	"flamengo",
	"corinthians",
	"palmeiras",
	"saopaulo",
	"vasco",
	"gremio",
];

const normalize = (value: string) =>
	value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Keeps only the letters: "Senha@123" and "senha2026!" both become "senha"
export const isCommonPassword = (password: string) => {
	const base = normalize(password).replace(/[^a-z]/g, "");
	return COMMON_PASSWORD_BASES.includes(base);
};

// Blocks passwords that contain the user's email (before the @) or a name part
export const containsPersonalData = (
	password: string,
	personalData: Array<string | null | undefined>
) => {
	const normalizedPassword = normalize(password);

	return personalData
		.filter((value): value is string => Boolean(value))
		.flatMap((value) => normalize(value.split("@")[0] ?? "").split(/\s+/))
		.filter((part) => part.length >= 3)
		.some((part) => normalizedPassword.includes(part));
};

export const passwordSchema = z
	.string()
	.max(
		PASSWORD_MAX_LENGTH,
		`A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`
	)
	.superRefine((password, context) => {
		const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
		if (failedRule) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				message: "A senha não atende a todos os requisitos",
			});
			return;
		}
		if (isCommonPassword(password)) {
			context.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Essa senha é muito comum. Escolha outra.",
			});
		}
	});

export const PERSONAL_DATA_MESSAGE =
	"A senha não pode conter seu nome ou e-mail";

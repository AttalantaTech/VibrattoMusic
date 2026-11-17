import { VibrattoApiError } from "@/api/middleware/errorHandler";

/** The code sent by e-mail: 6 digits, valid for 10 minutes, used once */
export const LOGIN_CODE_LENGTH = 6;

/** Wait before another code can be asked for, so the inbox isn't flooded */
export const RESEND_WAIT_SECONDS = 60;

/**
 * Only the digits of what was typed or pasted, up to the code length. A code
 * copied from the e-mail may come with the spaces it is shown with ("2 0 7 7
 * 5 8") or with text around it
 */
export const normalizeLoginCode = (value: string): string =>
	value.replace(/\D/g, "").slice(0, LOGIN_CODE_LENGTH);

export const isCompleteLoginCode = (value: string): boolean =>
	normalizeLoginCode(value).length === LOGIN_CODE_LENGTH;

/** "0:59", "1:00" */
export const formatWait = (seconds: number): string => {
	const safe = Math.max(0, Math.ceil(seconds));

	return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
};

/** The message the API wrote, when it wrote one */
const apiMessage = (error: VibrattoApiError): string | undefined => {
	const data = error.data as
		| { erros?: Array<string>; mensagem?: string }
		| undefined;
	const written = data?.erros?.find((item) => item.trim()) ?? data?.mensagem;

	return written?.trim() || undefined;
};

/**
 * What to tell the person when asking for the code (step "request") or
 * entering with it (step "verify") fails. The API's own message comes first:
 * it knows why (expired, used, wrong)
 */
export const loginCodeErrorMessage = (
	error: unknown,
	step: "request" | "verify"
): string => {
	if (!(error instanceof VibrattoApiError))
		return "Não foi possível continuar. Verifique sua conexão e tente novamente.";

	if (error.statusCode === 0)
		return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";

	if (error.statusCode === 429)
		return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.";

	if (error.statusCode >= 500)
		return "O servidor não respondeu como esperado. Tente novamente em alguns minutos.";

	const written = apiMessage(error);
	if (written) return written;

	return step === "verify"
		? "Código inválido ou vencido. Confira o código ou peça um novo."
		: "Não foi possível enviar o código. Confira o e-mail e tente novamente.";
};

/**
 * The API refuses the code for an e-mail without account with
 * 400 { erros: ["Email não cadastrado."] } (seen on 17/11/2026): the person
 * is offered the sign-up with that e-mail
 */
export const isNoAccountError = (error: unknown): boolean => {
	if (!(error instanceof VibrattoApiError)) return false;
	if (error.statusCode !== 400 && error.statusCode !== 404) return false;

	const message = apiMessage(error) ?? "";
	return /n[ãa]o (est[áa] )?cadastrad/i.test(message);
};

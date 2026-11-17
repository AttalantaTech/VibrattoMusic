import { VibrattoApiError } from "@/api/middleware/errorHandler";

/**
 * What to tell the person when the login with password fails. The API says
 * why in Portuguese ({ erros: ["Senha inválida."] } or ["Email não
 * cadastrado."]), so its message comes first; the rest covers the cases
 * where it says nothing or the failure isn't the person's
 */
export const loginErrorMessage = (error: unknown): string => {
	if (!(error instanceof VibrattoApiError))
		return "Erro ao entrar na conta. Tente novamente.";

	if (error.statusCode === 0)
		return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";

	if (error.statusCode === 429)
		return "Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.";

	if (error.statusCode >= 500)
		return "Erro interno do servidor. Tente novamente em alguns minutos.";

	const data = error.data as
		| { erros?: Array<string>; mensagem?: string }
		| undefined;
	const written = (
		data?.erros?.find((item) => item.trim()) ?? data?.mensagem
	)?.trim();
	if (written) return written;

	if (error.statusCode === 401) return "Email ou senha incorretos.";

	return "Erro ao entrar na conta. Verifique seus dados e tente novamente.";
};

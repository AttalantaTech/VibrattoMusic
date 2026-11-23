import { VibrattoApiError } from "@/api/middleware/errorHandler";

/** What to tell the person when accepting the term fails */
export const termErrorMessage = (error: unknown): string => {
	if (error instanceof VibrattoApiError) {
		if (error.statusCode === 0)
			return "Sem conexão com o servidor. Verifique sua internet e tente novamente.";

		const data = error.data as
			| { erros?: Array<string>; mensagem?: string }
			| undefined;
		const written = (
			data?.erros?.find((item) => item.trim()) ?? data?.mensagem
		)?.trim();
		if (written && error.statusCode < 500) return written;
	}

	return "Não foi possível registrar o aceite. Tente novamente.";
};

import { VibrattoApiError } from "@/api";
import { toast } from "sonner";

// The API may answer errors as { erros: [...] } or { mensagem: "..." }
const getApiErrorMessage = (error: VibrattoApiError) => {
	const data = error.data as
		| { erros?: Array<string>; mensagem?: string }
		| undefined;

	return data?.erros?.find((message) => message) ?? data?.mensagem;
};

// Same error handling used by the register and reset password screens
export const showApiError = (error: unknown, fallbackMessage: string) => {
	if (error instanceof VibrattoApiError) {
		if (error.statusCode === 500) {
			toast.error("Erro interno do servidor. Tente novamente mais tarde.");
			return;
		}

		toast.error(getApiErrorMessage(error) ?? fallbackMessage);
		return;
	}

	toast.error("Erro de conexão. Por favor, verifique sua internet.");
};

import { describe, expect, it } from "vitest";
import { VibrattoApiError } from "@/api/middleware/errorHandler";
import { loginErrorMessage } from "../loginError";

const apiError = (statusCode: number, data?: object) =>
	new VibrattoApiError({
		code: "X",
		message: "Invalid request format",
		statusCode,
		data: data as never,
		timestamp: "",
	});

describe("message of a failed login with password", () => {
	// The answers the API gave in a real attempt (17/11/2026)
	it("shows the API's message for a wrong password", () => {
		expect(
			loginErrorMessage(apiError(400, { erros: ["Senha inválida."] }))
		).toBe("Senha inválida.");
	});

	it("shows the API's message for an e-mail without account", () => {
		expect(
			loginErrorMessage(apiError(400, { erros: ["Email não cadastrado."] }))
		).toBe("Email não cadastrado.");
	});

	it("also reads a { mensagem } answer", () => {
		expect(
			loginErrorMessage(apiError(403, { mensagem: "Conta inativa." }))
		).toBe("Conta inativa.");
	});

	it("never shows the English default of the client", () => {
		expect(loginErrorMessage(apiError(400))).toBe(
			"Erro ao entrar na conta. Verifique seus dados e tente novamente."
		);
	});

	it("says e-mail or password are wrong on a bare 401", () => {
		expect(loginErrorMessage(apiError(401))).toBe("Email ou senha incorretos.");
	});

	it("doesn't blame the person for a server failure", () => {
		expect(
			loginErrorMessage(apiError(500, { erros: ["Object reference not set"] }))
		).toMatch(/servidor/);
	});

	it("tells about the connection when there is no answer", () => {
		expect(loginErrorMessage(apiError(0))).toMatch(/internet/);
	});

	it("has a message for anything else", () => {
		expect(loginErrorMessage(new Error("boom"))).toBe(
			"Erro ao entrar na conta. Tente novamente."
		);
	});
});

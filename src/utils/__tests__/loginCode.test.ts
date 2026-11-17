import { describe, expect, it } from "vitest";
import { VibrattoApiError } from "@/api/middleware/errorHandler";
import {
	formatWait,
	isNoAccountError,
	isCompleteLoginCode,
	loginCodeErrorMessage,
	normalizeLoginCode,
} from "../loginCode";

const apiError = (statusCode: number, data?: object) =>
	new VibrattoApiError({
		code: "X",
		message: "x",
		statusCode,
		data: data as never,
		timestamp: "",
	});

describe("login with a code sent by e-mail", () => {
	it("keeps only the 6 digits of a code pasted with spaces", () => {
		expect(normalizeLoginCode("2 0 7 7 5 8")).toBe("207758");
		expect(normalizeLoginCode("Código: 207758.")).toBe("207758");
	});

	it("never takes more than 6 digits", () => {
		expect(normalizeLoginCode("2077581234")).toBe("207758");
	});

	it("keeps a leading zero", () => {
		expect(normalizeLoginCode("012345")).toBe("012345");
	});

	it("is complete only with 6 digits", () => {
		expect(isCompleteLoginCode("20775")).toBe(false);
		expect(isCompleteLoginCode("207758")).toBe(true);
	});

	it("shows the wait before another code as m:ss", () => {
		expect(formatWait(60)).toBe("1:00");
		expect(formatWait(9)).toBe("0:09");
		expect(formatWait(-3)).toBe("0:00");
	});

	it("shows the API's own message when there is one", () => {
		expect(
			loginCodeErrorMessage(
				apiError(400, { erros: ["Código expirado."] }),
				"verify"
			)
		).toBe("Código expirado.");
		expect(
			loginCodeErrorMessage(
				apiError(404, { mensagem: "Usuário não encontrado." }),
				"request"
			)
		).toBe("Usuário não encontrado.");
	});

	it("explains a wrong code when the API says nothing", () => {
		expect(loginCodeErrorMessage(apiError(401), "verify")).toBe(
			"Código inválido ou vencido. Confira o código ou peça um novo."
		);
	});

	it("asks to wait after too many attempts", () => {
		expect(loginCodeErrorMessage(apiError(429), "request")).toMatch(
			/Muitas tentativas/
		);
	});

	it("doesn't blame the person for a server failure", () => {
		expect(
			loginCodeErrorMessage(
				apiError(500, { erros: ["NullReference"] }),
				"verify"
			)
		).toMatch(/servidor/);
	});

	it("tells about the connection when there is no answer", () => {
		expect(loginCodeErrorMessage(apiError(0), "request")).toMatch(/internet/);
	});
});

describe("an e-mail without account", () => {
	it("is recognized by the API's answer", () => {
		expect(
			isNoAccountError(apiError(400, { erros: ["Email não cadastrado."] }))
		).toBe(true);
		expect(
			isNoAccountError(
				apiError(404, { mensagem: "E-mail não está cadastrado" })
			)
		).toBe(true);
	});

	it("isn't confused with other refusals", () => {
		expect(
			isNoAccountError(apiError(400, { erros: ["Código inválido."] }))
		).toBe(false);
		expect(isNoAccountError(apiError(500, { erros: ["não cadastrado"] }))).toBe(
			false
		);
		expect(isNoAccountError(new Error("Email não cadastrado."))).toBe(false);
	});
});

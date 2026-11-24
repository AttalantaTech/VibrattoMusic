import { beforeEach, describe, expect, it } from "vitest";
import { VibrattoApiError } from "@/api/middleware/errorHandler";
import { isSignupTokenError, parseLoginCodeResponse } from "../loginCode";
import {
	clearConfirmedSignup,
	clearSignupEmail,
	readConfirmedSignup,
	readSignupEmail,
	saveConfirmedSignup,
} from "../signupEmail";

const apiError = (statusCode: number, erros: Array<string>) =>
	new VibrattoApiError({
		code: "X",
		message: "x",
		statusCode,
		data: { erros } as never,
		timestamp: "",
	});

// The code of the login also confirms a new e-mail before the sign-up
describe("e-mail confirmed with the code before the sign-up", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it("tells the session apart from the sign-up proof", () => {
		expect(parseLoginCodeResponse({ token: "jwt" })).toEqual({
			type: "login",
			token: "jwt",
		});
		expect(parseLoginCodeResponse("jwt")).toEqual({
			type: "login",
			token: "jwt",
		});
		expect(parseLoginCodeResponse({ tokenCadastro: "abc" })).toEqual({
			type: "signup",
			signupToken: "abc",
		});
		expect(parseLoginCodeResponse({})).toBeNull();
	});

	it("keeps the confirmed e-mail and fills the sign-up with it", () => {
		saveConfirmedSignup(" ana@exemplo.com ", "abc");

		expect(readConfirmedSignup()).toEqual({
			email: "ana@exemplo.com",
			token: "abc",
		});
		expect(readSignupEmail()).toBe("ana@exemplo.com");
	});

	it("'Trocar e-mail' asks the confirmation again, keeping the e-mail", () => {
		saveConfirmedSignup("ana@exemplo.com", "abc");

		clearConfirmedSignup();

		expect(readConfirmedSignup()).toBeNull();
		expect(readSignupEmail()).toBe("ana@exemplo.com");
	});

	it("forgets everything once the account is created", () => {
		saveConfirmedSignup("ana@exemplo.com", "abc");

		clearSignupEmail();

		expect(readConfirmedSignup()).toBeNull();
		expect(readSignupEmail()).toBe("");
	});

	it("knows when the sign-up refused the confirmation", () => {
		expect(
			isSignupTokenError(apiError(400, ["Token de cadastro vencido."]))
		).toBe(true);
		expect(isSignupTokenError(apiError(400, ["CPF inválido."]))).toBe(false);
		expect(isSignupTokenError(new Error("x"))).toBe(false);
	});
});

import { beforeEach, describe, expect, it } from "vitest";
import {
	clearSignupEmail,
	readSignupEmail,
	saveSignupEmail,
} from "../signupEmail";

// The e-mail typed in the login goes to the sign-up form, once
describe("e-mail carried from the login to the sign-up", () => {
	beforeEach(() => {
		sessionStorage.clear();
	});

	it("keeps the e-mail typed in the login, without spaces", () => {
		saveSignupEmail("  ana@exemplo.com ");

		expect(readSignupEmail()).toBe("ana@exemplo.com");
	});

	it("starts empty when nothing came from the login", () => {
		expect(readSignupEmail()).toBe("");
	});

	it("forgets the e-mail once the account is created", () => {
		saveSignupEmail("ana@exemplo.com");

		clearSignupEmail();

		expect(readSignupEmail()).toBe("");
	});
});

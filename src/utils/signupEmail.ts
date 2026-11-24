/**
 * The e-mail typed in the login, carried to the sign-up form when it has no
 * account yet, and the proof that it was confirmed with the code. Kept in the
 * tab (sessionStorage) and not in the address, so it doesn't end up in
 * history or in links
 */
const KEY = "signup-email";
const CONFIRMED_KEY = "signup-confirmed";

/** The e-mail confirmed with the code and the API's tokenCadastro for it */
export interface ConfirmedSignup {
	email: string;
	token: string;
}

export const saveSignupEmail = (email: string): void => {
	try {
		sessionStorage.setItem(KEY, email.trim());
	} catch {
		// Private mode without storage: the form just starts empty
	}
};

export const readSignupEmail = (): string => {
	try {
		return sessionStorage.getItem(KEY) ?? "";
	} catch {
		return "";
	}
};

export const saveConfirmedSignup = (email: string, token: string): void => {
	saveSignupEmail(email);
	try {
		sessionStorage.setItem(
			CONFIRMED_KEY,
			JSON.stringify({ email: email.trim(), token })
		);
	} catch {
		// Without storage the confirmation is asked again on the sign-up page
	}
};

export const readConfirmedSignup = (): ConfirmedSignup | null => {
	try {
		const stored = JSON.parse(
			sessionStorage.getItem(CONFIRMED_KEY) ?? "null"
		) as Partial<ConfirmedSignup> | null;
		return stored?.email && stored.token
			? { email: stored.email, token: stored.token }
			: null;
	} catch {
		return null;
	}
};

/** "Trocar e-mail" or a token the API refused: the e-mail is asked again */
export const clearConfirmedSignup = (): void => {
	try {
		sessionStorage.removeItem(CONFIRMED_KEY);
	} catch {
		// Nothing was stored
	}
};

/** The account was created: the next sign-up in this tab starts empty */
export const clearSignupEmail = (): void => {
	clearConfirmedSignup();
	try {
		sessionStorage.removeItem(KEY);
	} catch {
		// Nothing was stored
	}
};

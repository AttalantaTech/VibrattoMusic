/**
 * The e-mail typed in the login, carried to the sign-up form when it has no
 * account yet. Kept in the tab (sessionStorage) and not in the address, so
 * it doesn't end up in history or in links
 */
const KEY = "signup-email";

export const saveSignupEmail = (email: string): void => {
	try {
		sessionStorage.setItem(KEY, email.trim());
	} catch {
		// Private mode without storage: the form just starts empty
	}
};

/** The account was created: the next sign-up in this tab starts empty */
export const clearSignupEmail = (): void => {
	try {
		sessionStorage.removeItem(KEY);
	} catch {
		// Nothing was stored
	}
};

export const readSignupEmail = (): string => {
	try {
		return sessionStorage.getItem(KEY) ?? "";
	} catch {
		return "";
	}
};

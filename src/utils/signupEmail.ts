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

export const readSignupEmail = (): string => {
	try {
		return sessionStorage.getItem(KEY) ?? "";
	} catch {
		return "";
	}
};

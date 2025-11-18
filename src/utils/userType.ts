import { useAuthStore } from "../store/authStore";

export type StoredUserType = "cliente" | "produto_musical";

export const getStoredUserType = (): StoredUserType | null => {
	try {
		const persisted = localStorage.getItem("vibratto-auth");
		if (!persisted) return null;
		const parsed = JSON.parse(persisted) as {
			state?: { user?: { userType?: StoredUserType } };
		};
		const type = parsed?.state?.user?.userType;
		return type === "cliente" || type === "produto_musical" ? type : null;
 	} catch {
 		return null;
 	}
};

export const setStoredUserType = (userType: StoredUserType): void => {
 	try {
 		const { updateUser } = useAuthStore.getState();
 		updateUser({ userType });
 	} catch {
 		// noop
 	}
};




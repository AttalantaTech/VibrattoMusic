import { useAuthStore } from "../store/authStore";

export const useAuthCheck = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	const requireAuth = (action: () => void) => {
		if (!isAuthenticated) {
			const currentPath = window.location.pathname + window.location.search;
			const redirectUrl =
				currentPath !== "/login"
					? `?redirect=${encodeURIComponent(currentPath)}`
					: "";
			window.location.href = `/login${redirectUrl}`;
			return false;
		}
		action();
		return true;
	};

	return { requireAuth, isAuthenticated };
};

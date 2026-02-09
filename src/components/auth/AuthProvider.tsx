import { useEffect } from "react";
import Cookies from "js-cookie";
import { useAuthStore } from "../../store/authStore";
import type { User } from "../../api/types";
import { authSync } from "../../utils/authSync";
import { tokenRefreshService } from "../../services/tokenRefreshService";
import { isTokenExpired, extractUserIdFromToken } from "../../utils/jwt";

interface AuthProviderProps {
	children: React.ReactNode;
}

// Interface for the persisted auth state structure
interface PersistedAuthState {
	state: {
		user: User | null;
		token: string | null;
		refreshToken: string | null;
		isAuthenticated: boolean;
	};
	version: number;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const { setAuth, token, isAuthenticated, logout } = useAuthStore();

	useEffect(() => {
		// Force check localStorage for auth state
		const checkStoredAuth = () => {
			try {
				const storedState = localStorage.getItem("vibratto-auth");
				const storedToken = Cookies.get("authToken");
				if (storedState) {
					const parsed = JSON.parse(storedState) as PersistedAuthState;
					const persistedToken = parsed?.state?.token;
					const persistedRefreshToken = parsed?.state?.refreshToken;

					// Check if token is expired
					if (persistedToken && isTokenExpired(persistedToken)) {
						logout();
						return;
					}

					// If we have a persisted token but current state is empty, restore it
					if (persistedToken && !isAuthenticated) {
						// Sync token to cookies and API
						authSync.syncToken(persistedToken);
						if (persistedRefreshToken) {
							authSync.syncRefreshToken(persistedRefreshToken);
						}

						// Restore auth state (user data from localStorage)
						const persistedUser = parsed?.state?.user;
						if (persistedUser && typeof persistedUser === "object") {
							setAuth(
								persistedUser,
								persistedToken,
								persistedRefreshToken || undefined
							);
						}
					}
				}

				// Fallback: check cookies if localStorage is empty but cookie exists
				if (storedToken && !isAuthenticated && !token) {
					// Check if cookie token is expired
					if (isTokenExpired(storedToken)) {
						authSync.clearToken();
						return;
					}

					authSync.syncToken(storedToken);

					// Extract user ID from token
					const userIdFromToken = extractUserIdFromToken(storedToken);

					// Create minimal user object
					const user: User = {
						id: userIdFromToken || 0, // Use extracted ID from token
						email: "",
						nome: "",
						ativo: true,
					};

					setAuth(user, storedToken);
				}
			} catch (error) {
				console.error("❌ Error checking stored auth:", error);
			}
		};

		// Run check immediately
		checkStoredAuth();

		// Also run check when storage changes (cross-tab sync)
		window.addEventListener("storage", checkStoredAuth);
		return () => {
			window.removeEventListener("storage", checkStoredAuth);
		};
	}, [isAuthenticated, setAuth, token, logout]); // Include dependencies

	useEffect(() => {
		// Sync check when auth state changes
		const storedToken = Cookies.get("authToken");

		if (isAuthenticated && token && storedToken) {
			// Ensure tokens are in sync
			if (storedToken !== token) {
				console.warn("⚠️ Token mismatch detected, syncing with store token");
				authSync.syncToken(token);
			}
		} else if (!storedToken && isAuthenticated) {
			// If no token in cookies but user thinks they're authenticated, clear the state
			console.warn(
				"⚠️ Auth state inconsistency detected - clearing auth state"
			);
			logout();
		}
	}, [token, isAuthenticated, logout]);

	// Start/stop token refresh service based on auth state
	useEffect(() => {
		if (isAuthenticated && token) {
			tokenRefreshService.start();
		} else {
			tokenRefreshService.stop();
		}

		return () => {
			tokenRefreshService.stop();
		};
	}, [isAuthenticated, token]);

	return <>{children}</>;
};

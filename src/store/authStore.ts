import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../api/types";
import { authSync } from "../utils/authSync";

interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	token: string | null;
	refreshToken: string | null;
	setAuth: (user: User, token: string, refreshToken?: string) => void;
	setToken: (token: string) => void;
	logout: () => void;
	clearAuth: () => void;
	updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			isAuthenticated: false,
			token: null,
			refreshToken: null,
			setAuth: (user: User, token: string, refreshToken?: string) => {
				// First update the Zustand store
				const newState = {
					user,
					token,
					refreshToken: refreshToken || null,
					isAuthenticated: true,
				};
				set(newState);

				// Then sync token across other systems (cookies + API client)
				authSync.syncToken(token);
				if (refreshToken) {
					authSync.syncRefreshToken(refreshToken);
				}

				// Manually trigger localStorage save (fallback)
				try {
					const persistedState = {
						state: newState,
						version: 0,
					};
					localStorage.setItem("vibratto-auth", JSON.stringify(persistedState));
				} catch (error) {
					console.error("❌ Failed to manually save auth state:", error);
				}
			},
			setToken: (token: string) => {
				set({ token });
				authSync.syncToken(token);
			},
			logout: () => {
				// Clear token from all systems
				authSync.clearToken();
				authSync.clearRefreshToken();

				// Clear ALL user-specific data from localStorage
				try {
					if (typeof Storage !== "undefined" && localStorage) {
						// Get all localStorage keys
						const keys = Object.keys(localStorage);

						// Keys to KEEP (global app settings, not user-specific)
						const keysToKeep: string[] = [
							// Add any truly global keys here that should persist across users
							// Currently none, as all data should be user-specific
						];

						// Remove ALL keys except the ones we want to keep
						keys.forEach(key => {
							if (!keysToKeep.includes(key)) {
								localStorage.removeItem(key);
							}
						});

						console.log(`🧹 Cleared ${keys.length - keysToKeep.length} items from localStorage on logout`);
					}
				} catch (error) {
					console.warn("Failed to clear user data from localStorage:", error);
				}

				set({
					user: null,
					token: null,
					refreshToken: null,
					isAuthenticated: false,
				});
			},
			clearAuth: () => {
				set({
					user: null,
					token: null,
					refreshToken: null,
					isAuthenticated: false,
				});
				localStorage.removeItem("vibratto-auth");
			},
			updateUser: (updatedUser: Partial<User>) => {
				const currentUser = get().user;
				if (currentUser) {
					set({
						user: { ...currentUser, ...updatedUser },
					});
				}
			},
		}),
		{
			name: "vibratto-auth",
			partialize: (state) => ({
				user: state.user,
				token: state.token,
				refreshToken: state.refreshToken,
				isAuthenticated: state.isAuthenticated,
			}), // Add storage event listener for cross-tab synchronization
			onRehydrateStorage: () => (state) => {
				if (state?.token) {
					authSync.syncToken(state.token);
				}
			},
		}
	)
);

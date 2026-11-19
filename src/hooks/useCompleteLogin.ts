import { useRouter } from "@tanstack/react-router";
import { apiClient } from "@/api/core/client";
import type { LoginResponse, User } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import { extractUserIdFromToken } from "@/utils/jwt";

/**
 * The end of every login (password or code, also from the sign-up page when
 * the e-mail already had an account): the user's data, the session and the
 * page the person came from. Throws when the user's data can't be read
 */
export const useCompleteLogin = () => {
	const router = useRouter();
	const setAuth = useAuthStore((state) => state.setAuth);

	return async (response: LoginResponse): Promise<void> => {
		if (!response.token) throw new Error("Invalid token received from API");

		// Extract user ID from JWT token
		const userIdFromToken = extractUserIdFromToken(response.token);
		const user = await apiClient.get<User>("usuario", {
			headers: { Authorization: `Bearer ${response.token}` },
		});

		// Set auth with the data from login response
		setAuth(
			{
				id: userIdFromToken || 0, // Use extracted ID from token
				email: user.email,
				nome: user.nome,
				ativo: true,
				userType: response.userType,
			},
			response.token,
			response.refreshToken
		);

		// Wait a moment for the auth state to stabilize
		await new Promise((resolve) => {
			setTimeout(() => {
				resolve(undefined);
			}, 100);
		});

		// Unified routing: everyone goes to the home page, unless the login
		// was asked by another page (?redirect=)
		const redirectTo =
			new URLSearchParams(window.location.search).get("redirect") || "/";

		await router.navigate({ to: redirectTo });
	};
};

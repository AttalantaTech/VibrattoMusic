import { useLogin, useRegisterUser } from "@/hooks/useUser";
import type { RegisterFormData } from "../schemas/registerSchema";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@tanstack/react-router";
import { getStoredUserType, setStoredUserType } from "@/utils/userType";
import { onlyAlphanumeric, onlyDigits } from "@/utils/validation";
import { showApiError } from "@/utils/showApiError";

export function useRegisterSubmit() {
	const router = useRouter();
	const registerMutation = useRegisterUser();
	const loginMutation = useLogin();
	const setAuth = useAuthStore((state) => state.setAuth);

	const onSubmit = async (data: RegisterFormData) => {
		try {
			const isCnpj = data.tipoDocumento === "cnpj";

			const finalRegisterData = {
				email: data.email,
				senha: data.senha,
				nome: data.nome,
				cpfOuCnpj: onlyAlphanumeric(data.cpfOuCnpj),
				cpfResponsavelLegal: isCnpj
					? onlyDigits(data.cpfResponsavelLegal)
					: null,
				nomeResponsavelLegal: isCnpj ? data.nomeResponsavelLegal : null,
				celular: onlyDigits(data.celular),
				cep: onlyDigits(data.cep),
				logradouro: data.logradouro,
				numero: data.numero,
				bairro: data.bairro,
				cidade: data.cidade,
				estado: data.estado.toUpperCase(),
				complemento: data.complemento,
			};

			const registeredUser =
				await registerMutation.mutateAsync(finalRegisterData);

			// Automatically log in the user after registration
			const loginResponse = await loginMutation.mutateAsync({
				email: data.email,
				senha: data.senha,
			});

			// Set authentication state
			const user = loginResponse.user || registeredUser;
			setAuth(
				user,
				loginResponse.token || loginResponse.Token,
				loginResponse.refreshToken
			);

			// Check for temporary user choice made during user type selection
			const temporaryUserChoice = localStorage.getItem("temp-user-choice") as
				| "cliente"
				| "produto_musical"
				| null;
			if (temporaryUserChoice) {
				// Set the user type based on the temporary choice
				setStoredUserType(temporaryUserChoice);
				localStorage.removeItem("temp-user-choice"); // Clean up

				// Navigate based on user type: clients skip onboarding and go to home
				if (temporaryUserChoice === "cliente") {
					await router.navigate({ to: "/" });
				} else if (temporaryUserChoice === "produto_musical") {
					await router.navigate({ to: "/band/profile-type" });
				}
				return;
			}

			// Fallback: Redirect based on persisted userType in vibratto-auth
			const userType = getStoredUserType();
			// If userType isn't set yet, force selection
			if (!userType) {
				await router.navigate({ to: "/welcome" });
				return;
			}
			// Ensure store reflects persisted value
			setStoredUserType(userType);
			if (userType === "cliente") {
				await router.navigate({ to: "/" });
			} else if (userType === "produto_musical") {
				await router.navigate({ to: "/band/profile-type" });
			}
		} catch (error: unknown) {
			showApiError(
				error,
				"Erro ao criar conta. Preencha os campos obrigatórios e tente novamente."
			);
		}
	};

	return { onSubmit };
}

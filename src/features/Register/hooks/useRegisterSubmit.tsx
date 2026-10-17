import { useLogin, useRegisterUser } from "@/hooks/useUser";
import type { RegisterFormData } from "../schemas/registerSchema";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "@tanstack/react-router";
import { VibrattoApiError } from "@/api";
import { toast } from "sonner";
import { getStoredUserType, setStoredUserType } from "@/utils/userType";

export function useRegisterSubmit() {
	const router = useRouter();
	const registerMutation = useRegisterUser();
	const loginMutation = useLogin();
	const setAuth = useAuthStore((state) => state.setAuth);

	const onSubmit = async (data: RegisterFormData) => {
		try {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { confirmarSenha, cpfOuCnpj, ...registerData } = data;

			const finalRegisterData = {
				...registerData,

				cpfResponsavelLegal:
					registerData.cpfResponsavelLegal?.replace(/\D/g, "") || null,
				nomeResponsavelLegal: registerData.nomeResponsavelLegal || null,

				cep: registerData.cep?.replace(/\D/g, "") || "", // Remove non-numeric characters from CEP
				cpfOuCnpj: cpfOuCnpj.replace(/\D/g, "") || "",
				celular: registerData.celular.replace(/\D/g, ""),
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
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
					return;
				} else if (errorMessage) {
					toast.error(errorMessage);
					return;
				}

				toast.error(
					"Erro ao criar conta. Preencha os campos obrigatórios e tente novamente."
				);
				return;
			}
		}
	};

	return { onSubmit };
}

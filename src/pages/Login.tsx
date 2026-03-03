import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useLogin } from "../hooks/useUser";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/Button/Button";
import { InputField } from "../components/forms/InputField/InputField";
import { Link, useRouter } from "@tanstack/react-router";
import { extractUserIdFromToken } from "../utils/jwt";
import Logo from "../assets/images/Logomark.png";
import ShowImg from "../assets/images/show.jpg";
import { apiClient } from "@/api/core/client";
import { User } from "@/api/types";

const loginSchema = z.object({
	email: z.string().email("Email inválido"),
	senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();
	const setAuth = useAuthStore((state) => state.setAuth);
	const loginMutation = useLogin();

	// Get redirect URL from query params
	const urlParameters = new URLSearchParams(window.location.search);
	const customRedirect = urlParameters.get("redirect");

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setError,
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});
	const onSubmit = async (data: LoginFormData) => {
		try {
			const response = await loginMutation.mutateAsync(data);

			if (!response.token) {
				console.error("❌ No token received from API response:", response);
				setError("root", {
					message: "Erro na resposta da API - token não encontrado",
				});
				return;
			}

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

			// Determine redirect - always go to home page for unified experience
			let redirectTo = customRedirect;
			if (!redirectTo) {
				// Unified routing: all users go to home page with musician list
				redirectTo = "/";
			}

			await router.navigate({ to: redirectTo });
		} catch (error: unknown) {
			console.error("❌ Login error details:", error);

			if (error && typeof error === "object" && "response" in error) {
				const responseError = error as {
					response?: { status?: number; data?: { mensagem?: string } };
				};

				const status = responseError.response?.status;
				const message = responseError.response?.data?.mensagem;

				// Map specific error codes to user-friendly messages
				switch (status) {
					case 400:
						setError("root", {
							message:
								message ?? "Dados inválidos. Verifique os campos preenchidos.",
						});
						break;
					case 401:
						setError("root", {
							message: "Email ou senha incorretos.",
						});
						break;
					case 409:
						setError("root", {
							message: "Conflito nos dados. Tente novamente.",
						});
						break;
					case 500:
						setError("root", {
							message:
								"Erro interno do servidor. Tente novamente em alguns minutos.",
						});
						break;
					default:
						setError("root", {
							message: message ?? "Erro ao entrar na conta. Tente novamente.",
						});
				}
			} else {
				// Handle network errors or URL construction errors - but avoid "Invalid request format" confusion
				const errorMessage =
					error instanceof Error
						? error.message
						: "Erro ao entrar na conta. Tente novamente.";

				// Don't prefix with "Erro de conexão:" for authentication-related errors
				if (
					errorMessage.includes("Invalid") ||
					errorMessage.includes("request")
				) {
					setError("root", {
						message:
							"Erro ao entrar na conta. Verifique seus dados e tente novamente.",
					});
				} else {
					setError("root", {
						message: `${errorMessage}`,
					});
				}
			}
		}
	};

	return (
		<div className="flex flex-col lg:flex-row h-screen w-screen justify-center items-center">
			{/* Content */}
			<div className="flex flex-col w-full lg:w-1/2 h-full justify-center items-center gap-6 px-4 lg:px-0">
				<div className="w-full max-w-md lg:w-[50%] flex flex-col">
					{/* Header */}
					<div className="flex flex-col justify-center items-center gap-4 lg:gap-6 text-center">
						<div className="w-[153px] flex items-center justify-around">
							<img
								alt="Vibratto logo"
								className="w-[26.25px] h-[43.46px]"
								src={Logo}
							/>
							<h2 className="font-semibold text-[#007BFF] text-lg sm:text-[22px]">
								Vibratto
							</h2>
						</div>
						<div className="flex flex-col gap-2 lg:gap-3 w-full">
							<h1 className="font-semibold text-2xl sm:text-3xl">
								Entre na sua conta
							</h1>
							<h2 className="font-normal text-sm sm:text-base text-gray-500">
								Bem-vindo de volta!
							</h2>
						</div>
					</div>

					{/* Inputs */}
					<form
						className="flex flex-col w-full justify-center items-center gap-4 lg:gap-6 pt-4 lg:pt-6"
						onSubmit={handleSubmit(onSubmit)}
					>
						<div className="flex flex-col gap-4 lg:gap-5 w-full">
							<div>
								<InputField
									{...register("email")}
									autoComplete="email"
									icon={<Mail size={20} />}
									label="Email"
									placeholder="exemplo@vibratto.com"
									type="email"
								/>
								{errors.email && (
									<p className="text-red-600 text-sm mt-1">
										{errors.email.message}
									</p>
								)}
							</div>
							<div className="relative">
								<InputField
									{...register("senha")}
									autoComplete="current-password"
									icon={<Lock size={20} />}
									label="Senha"
									type={showPassword ? "text" : "password"}
								/>
								<button
									className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
									type="button"
									onClick={() => {
										setShowPassword(!showPassword);
									}}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5 text-gray-400" />
									) : (
										<Eye className="h-5 w-5 text-gray-400" />
									)}
								</button>
								{errors.senha && (
									<p className="text-red-600 text-sm mt-1">
										{errors.senha.message}
									</p>
								)}
							</div>
							{errors.root && (
								<div className="text-red-600 text-sm text-center">
									{errors.root.message}
								</div>
							)}
							<div className="flex items-center justify-end">
								<Link
									className="text-xs sm:text-sm text-blue-600 hover:text-blue-500"
									to="/forgot-password"
								>
									Esqueceu sua senha?
								</Link>
							</div>
							<Button
								className="w-full font-semibold"
								disabled={isSubmitting || loginMutation.isPending}
								type="submit"
							>
								{isSubmitting || loginMutation.isPending
									? "Entrando..."
									: "Entrar"}
							</Button>
						</div>
					</form>

					<div className="flex flex-col gap-4 lg:gap-6 w-full mt-3">
						<div className="text-xs sm:text-sm flex items-center justify-center text-center">
							<p className="text-gray-500 text-normal">
								Não tem uma conta?{" "}
								<Link className="font-semibold text-[#007BFF]" to="/welcome">
									Cadastre-se
								</Link>
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="hidden lg:flex lg:w-1/2 items-center justify-center h-screen py-3">
				<img
					alt="Imagem ilustrativa"
					className="w-full h-full object-cover rounded"
					src={ShowImg}
				/>
			</div>
		</div>
	);
};

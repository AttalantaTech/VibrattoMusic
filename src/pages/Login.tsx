import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useLogin } from "../hooks/useUser";
import { BackToHomeLink, HomeLogoLink } from "../components/auth/HomeLinks";
import { Button } from "../components/ui/Button/Button";
import { InputField } from "../components/forms/InputField/InputField";
import { Link, useRouter } from "@tanstack/react-router";
import ShowImg from "../assets/images/show.jpg";
import { LoginWithCode } from "../components/auth/LoginWithCode";
import { loginErrorMessage } from "@/utils/loginError";
import { isNoAccountError } from "@/utils/loginCode";
import { CreateAccountButton } from "../components/auth/CreateAccountButton";
import { useCompleteLogin } from "@/hooks/useCompleteLogin";
import { saveConfirmedSignup } from "@/utils/signupEmail";
import { toast } from "sonner";

const loginSchema = z.object({
	email: z.string().email("Email inválido"),
	senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
	const [showPassword, setShowPassword] = useState(false);
	// Two ways in: password (as always) or a code sent to the e-mail
	const [method, setMethod] = useState<"password" | "code">("password");
	// The e-mail has no account: offer the sign-up with it
	const [hasNoAccount, setHasNoAccount] = useState(false);
	const router = useRouter();
	const loginMutation = useLogin();
	const completeLogin = useCompleteLogin();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setError,
		getValues,
		setValue,
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		setHasNoAccount(false);
		try {
			const response = await loginMutation.mutateAsync(data);

			if (!response.token) {
				console.error("❌ No token received from API response:", response);
				setError("root", {
					message: "Erro na resposta da API - token não encontrado",
				});
				return;
			}

			await completeLogin(response);
		} catch (error: unknown) {
			console.error("❌ Login error details:", error);
			setError("root", { message: loginErrorMessage(error) });
			setHasNoAccount(isNoAccountError(error));
		}
	};

	return (
		<div className="flex flex-col lg:flex-row h-screen w-screen justify-center items-center">
			{/* Content */}
			<div className="flex flex-col w-full lg:w-1/2 h-full justify-center items-center gap-6 px-4 lg:px-0">
				<div className="w-full max-w-md lg:w-[50%] flex flex-col">
					<BackToHomeLink />
					{/* Header */}
					<div className="flex flex-col justify-center items-center gap-2 lg:gap-6 text-center">
						<HomeLogoLink />
						<div className="flex flex-col gap-2 lg:gap-3 w-full">
							<h1 className="font-semibold text-2xl sm:text-3xl">
								Entre na sua conta
							</h1>
							<h2 className="font-normal text-sm sm:text-base text-gray-500">
								{method === "code"
									? "Entrar com código"
									: "Bem-vindo de volta!"}
							</h2>
						</div>
					</div>

					{method === "code" ? (
						<LoginWithCode
							initialEmail={getValues("email")}
							onLoggedIn={completeLogin}
							onSignupConfirmed={(email, signupToken) => {
								// A new e-mail, already confirmed: on to the sign-up
								saveConfirmedSignup(email, signupToken);
								toast.success(
									"E-mail confirmado! Agora escolha como vai usar a Vibratto."
								);
								void router.navigate({ to: "/welcome" });
							}}
							onUsePassword={(email) => {
								if (email) setValue("email", email);
								setMethod("password");
							}}
						/>
					) : (
						/* Inputs */
						<form
							className="flex flex-col w-full justify-center items-center gap-4 lg:gap-6 pt-4 lg:pt-6"
							onSubmit={handleSubmit(onSubmit)}
						>
							<div className="flex flex-col gap-4 lg:gap-5 w-full">
								<div>
									<InputField
										{...register("email", {
											onChange: () => {
												setHasNoAccount(false);
											},
										})}
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
								{hasNoAccount && (
									<CreateAccountButton email={getValues("email")} />
								)}
								<div className="flex items-center justify-end">
									<Link
										className="text-xs sm:text-sm text-primary-600 hover:text-primary-500"
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

								<div className="flex items-center gap-3 text-xs text-gray-400">
									<span className="h-px flex-1 bg-gray-200" />
									ou
									<span className="h-px flex-1 bg-gray-200" />
								</div>

								<Button
									className="w-full font-semibold"
									variant="outline"
									type="button"
									onClick={() => {
										setMethod("code");
									}}
								>
									Entrar com código por e-mail
								</Button>
							</div>
						</form>
					)}

					<div className="flex flex-col gap-4 lg:gap-6 w-full mt-3">
						<div className="text-xs sm:text-sm flex items-center justify-center text-center">
							<p className="text-gray-500 text-normal">
								Não tem uma conta?{" "}
								<Link className="font-semibold text-primary-600" to="/welcome">
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

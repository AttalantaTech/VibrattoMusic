import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useResetPassword } from "@/hooks/useUser";
import { Button } from "@/components/ui/Button/Button";
import { InputField } from "@/components/forms/InputField/InputField";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import LogoVibratto from "@/assets/images/Logo_Vibratto.png";
import VibrattoName from "@/assets/images/Vibratto.png";
import ShowImg from "@/assets/images/show.jpg";
import { VibrattoApiError } from "@/api";
import { toast } from "sonner";
import { passwordSchema } from "@/utils/password";
import { PasswordRequirements } from "@/components/forms/PasswordRequirements";

const resetPasswordSchema = z
	.object({
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPassword() {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [passwordReset, setPasswordReset] = useState(false);
	const resetPasswordMutation = useResetPassword();
	const router = useRouter();
	const { token } = useParams({ from: "/reset-password/$token/edit" });

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<ResetPasswordFormData>({
		resolver: zodResolver(resetPasswordSchema),
	});

	const onSubmit = async (data: ResetPasswordFormData) => {
		if (!token) {
			toast.error(
				"Token de redefinição não encontrado. Por favor, use o link enviado por email."
			);
			return;
		}

		try {
			await resetPasswordMutation.mutateAsync({
				token,
				novaSenha: data.password,
			});
			setPasswordReset(true);
			// Redirect to login after 3 seconds
			setTimeout(() => {
				void router.navigate({ to: "/login" });
			}, 3000);
		} catch (error: unknown) {
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error("Erro interno do servidor. Tente novamente mais tarde.");
					return;
				} else if (errorMessage) {
					toast.error(errorMessage);
					return;
				}
				toast.error("Aconteceu um erro ao tentar processar sua solicitação.");
			} else {
				toast.error("Erro de conexão. Por favor, verifique sua internet.");
			}
		}
	};

	if (passwordReset) {
		return (
			<div className="flex flex-col lg:flex-row h-screen w-screen justify-center items-center">
				{/* Content */}
				<div className="flex flex-col w-full lg:w-1/2 h-full justify-center items-center gap-6 px-4 lg:px-0">
					<div className="w-full max-w-md lg:w-[50%] flex flex-col">
						{/* Header */}
						<div className="flex flex-col justify-center items-center gap-4 lg:gap-6 text-center">
							<div className="flex items-center justify-around">
								<img
									alt="Vibratto logo"
									className="w-auto h-8"
									src={LogoVibratto}
								/>
								<img
									alt="Vibratto logo"
									className="w-auto h-3 sm:h-4"
									src={VibrattoName}
								/>
							</div>
							<div className="flex flex-col gap-4 items-center">
								<CheckCircle className="w-16 h-16 text-green-500" />
								<h1 className="font-semibold text-2xl sm:text-3xl">
									Senha Redefinida com Sucesso!
								</h1>
								<p className="text-sm sm:text-base text-gray-600">
									Sua senha foi alterada com sucesso. Você será redirecionado
									para a página de login em instantes...
								</p>
							</div>
						</div>

						<div className="flex flex-col gap-4 lg:gap-6 w-full mt-6">
							<Link to="/login">
								<Button className="w-full font-semibold">
									Ir para o Login
								</Button>
							</Link>
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
	}

	if (!token) {
		return (
			<div className="flex flex-col lg:flex-row h-screen w-screen justify-center items-center">
				{/* Content */}
				<div className="flex flex-col w-full lg:w-1/2 h-full justify-center items-center gap-6 px-4 lg:px-0">
					<div className="w-full max-w-md lg:w-[50%] flex flex-col">
						{/* Header */}
						<div className="flex flex-col justify-center items-center gap-4 lg:gap-6 text-center">
							<div className="flex items-center justify-around">
								<img
									alt="Vibratto logo"
									className="w-auto h-8"
									src={LogoVibratto}
								/>
								<img
									alt="Vibratto logo"
									className="w-auto h-3 sm:h-4"
									src={VibrattoName}
								/>
							</div>
							<div className="flex flex-col gap-2 lg:gap-3 w-full">
								<h1 className="font-semibold text-2xl sm:text-3xl text-red-600">
									Link Inválido
								</h1>
								<p className="text-sm sm:text-base text-gray-600">
									O link de redefinição de senha está inválido ou expirou. Por
									favor, solicite um novo link.
								</p>
							</div>
						</div>

						<div className="flex flex-col gap-4 lg:gap-6 w-full mt-6">
							<Link to="/forgot-password">
								<Button className="w-full font-semibold">
									Solicitar Novo Link
								</Button>
							</Link>
							<Link
								className="text-center text-sm text-primary-600 hover:text-primary-500"
								to="/login"
							>
								Voltar para o Login
							</Link>
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
	}

	return (
		<div className="flex flex-col lg:flex-row h-screen w-screen justify-center items-center">
			{/* Content */}
			<div className="flex flex-col w-full lg:w-1/2 h-full justify-center items-center gap-6 px-4 lg:px-0">
				<div className="w-full max-w-md lg:w-[50%] flex flex-col">
					{/* Header */}
					<div className="flex flex-col justify-center items-center gap-4 lg:gap-6 text-center">
						<div className="flex items-center justify-around">
							<img
								alt="Vibratto logo"
								className="w-auto h-8"
								src={LogoVibratto}
							/>
							<img
								alt="Vibratto logo"
								className="w-auto h-3 sm:h-4"
								src={VibrattoName}
							/>
						</div>
						<div className="flex flex-col gap-2 lg:gap-3 w-full">
							<h1 className="font-semibold text-2xl sm:text-3xl">
								Redefinir Senha
							</h1>
							<h2 className="font-normal text-sm sm:text-base text-gray-500">
								Digite sua nova senha abaixo
							</h2>
						</div>
					</div>

					{/* Form */}
					<form
						className="flex flex-col w-full justify-center items-center gap-4 lg:gap-6 pt-4 lg:pt-6"
						onSubmit={handleSubmit(onSubmit)}
					>
						<div className="flex flex-col gap-4 lg:gap-5 w-full">
							<div>
								<div className="relative">
									<InputField
										{...register("password")}
										autoComplete="new-password"
										icon={<Lock size={20} />}
										label="Nova Senha"
										type={showPassword ? "text" : "password"}
										placeholder="Digite sua nova senha"
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
								</div>
								<PasswordRequirements password={watch("password")} />
								{errors.password && (
									<p className="text-red-600 text-sm mt-1">
										{errors.password.message}
									</p>
								)}
							</div>
							<div>
								<div className="relative">
									<InputField
										{...register("confirmPassword")}
										autoComplete="new-password"
										icon={<Lock size={20} />}
										label="Confirmar Nova Senha"
										type={showConfirmPassword ? "text" : "password"}
										placeholder="Digite novamente sua nova senha"
									/>
									<button
										className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
										type="button"
										onClick={() => {
											setShowConfirmPassword(!showConfirmPassword);
										}}
									>
										{showConfirmPassword ? (
											<EyeOff className="h-5 w-5 text-gray-400" />
										) : (
											<Eye className="h-5 w-5 text-gray-400" />
										)}
									</button>
								</div>
								{errors.confirmPassword && (
									<p className="text-red-600 text-sm mt-1">
										{errors.confirmPassword.message}
									</p>
								)}
							</div>
							{errors.root && (
								<div className="text-red-600 text-sm text-center">
									{errors.root.message}
								</div>
							)}
							<Button
								className="w-full font-semibold"
								disabled={isSubmitting || resetPasswordMutation.isPending}
								type="submit"
							>
								{isSubmitting || resetPasswordMutation.isPending
									? "Redefinindo..."
									: "Redefinir Senha"}
							</Button>
						</div>
					</form>

					<div className="flex flex-col gap-4 lg:gap-6 w-full mt-4">
						<div className="text-xs sm:text-sm text-center">
							<p className="text-gray-500">
								Lembrou sua senha?{" "}
								<Link className="font-semibold text-primary-600" to="/login">
									Faça login
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
}

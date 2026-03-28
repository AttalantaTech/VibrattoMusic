import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft } from "lucide-react";
import { useForgotPassword } from "../hooks/useUser";
import { Button } from "../components/ui/Button/Button";
import { InputField } from "../components/forms/InputField/InputField";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import LogoVibratto from "../assets/images/Logo_Vibratto.png";
import VibrattoName from "../assets/images/Vibratto.png";
import ShowImg from "../assets/images/show.jpg";

const forgotPasswordSchema = z.object({
	email: z.string().email("Email inválido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordComponent() {
	const [emailSent, setEmailSent] = useState(false);
	const forgotPasswordMutation = useForgotPassword();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		setError,
		getValues,
	} = useForm<ForgotPasswordFormData>({
		resolver: zodResolver(forgotPasswordSchema),
	});

	const onSubmit = async (data: ForgotPasswordFormData) => {
		try {
			await forgotPasswordMutation.mutateAsync(data);
			setEmailSent(true);
		} catch (error: unknown) {
			console.error("❌ Forgot password error details:", error);

			if (error && typeof error === "object" && "response" in error) {
				const responseError = error as {
					response?: { status?: number; data?: { mensagem?: string } };
				};

				const status = responseError.response?.status;
				const message = responseError.response?.data?.mensagem;

				switch (status) {
					case 404:
						setError("email", {
							message: "Email não encontrado em nosso sistema.",
						});
						break;
					case 429:
						setError("root", {
							message:
								"Muitas tentativas. Por favor, aguarde alguns minutos antes de tentar novamente.",
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
							message:
								message ?? "Erro ao enviar email. Por favor, tente novamente.",
						});
				}
			} else {
				setError("root", {
					message: "Erro de conexão. Por favor, verifique sua internet.",
				});
			}
		}
	};

	if (emailSent) {
		const email = getValues("email");
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
									className="w-auto  h-6"
									src={VibrattoName}
								/>
							</div>
							<div className="flex flex-col gap-2 lg:gap-3 w-full">
								<h1 className="font-semibold text-2xl sm:text-3xl">
									Email Enviado!
								</h1>
								<div className="flex flex-col gap-2 text-sm sm:text-base text-gray-600">
									<p>
										Enviamos instruções de recuperação de senha para o email:
									</p>
									<p className="font-semibold text-gray-800">{email}</p>
									<p className="mt-2">
										Por favor, verifique sua caixa de entrada e siga as
										instruções no email para redefinir sua senha.
									</p>
									<p className="text-xs text-gray-500 mt-2">
										Não recebeu o email? Verifique sua pasta de spam ou tente
										novamente em alguns minutos.
									</p>
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-4 lg:gap-6 w-full mt-6">
							<Link to="/login">
								<Button className="w-full font-semibold">
									Voltar para o Login
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
								className="w-auto  h-6"
								src={VibrattoName}
							/>
						</div>
						<div className="flex flex-col gap-2 lg:gap-3 w-full">
							<h1 className="font-semibold text-2xl sm:text-3xl">
								Esqueceu sua senha?
							</h1>
							<h2 className="font-normal text-sm sm:text-base text-gray-500">
								Não se preocupe! Digite seu email e enviaremos instruções para
								redefinir sua senha.
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
								<InputField
									{...register("email")}
									autoComplete="email"
									icon={<Mail size={20} />}
									label="Email"
									placeholder="exemplo@vibratto.com"
									type="email"
									autoFocus
								/>
								{errors.email && (
									<p className="text-red-600 text-sm mt-1">
										{errors.email.message}
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
								disabled={isSubmitting || forgotPasswordMutation.isPending}
								type="submit"
							>
								{isSubmitting || forgotPasswordMutation.isPending
									? "Enviando..."
									: "Enviar Email de Recuperação"}
							</Button>
						</div>
					</form>

					<div className="flex flex-col gap-4 lg:gap-6 w-full mt-4">
						<Link
							className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-500"
							to="/login"
						>
							<ArrowLeft size={16} />
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

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordComponent,
});

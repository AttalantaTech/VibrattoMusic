import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	ArrowLeft,
	CheckCircle,
	Eye,
	EyeOff,
	KeyRound,
	Lock,
	Mail,
} from "lucide-react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useForgotPassword, useResetPassword } from "../hooks/useUser";
import { Button } from "../components/ui/Button/Button";
import { InputField } from "../components/forms/InputField/InputField";
import { PasswordRequirements } from "../components/forms/PasswordRequirements";
import { passwordSchema } from "../utils/password";
import {
	LOGIN_CODE_LENGTH,
	RESEND_WAIT_SECONDS,
	formatWait,
	isCompleteLoginCode,
	loginCodeErrorMessage,
	normalizeLoginCode,
} from "../utils/loginCode";
import LogoVibratto from "../assets/images/Logo_Vibratto.png";
import VibrattoName from "../assets/images/Vibratto.png";
import ShowImg from "../assets/images/show.jpg";

const emailSchema = z.object({
	email: z.string().trim().email("Email inválido"),
});

const newPasswordSchema = z
	.object({
		code: z
			.string()
			.refine(isCompleteLoginCode, `O código tem ${LOGIN_CODE_LENGTH} dígitos`),
		password: passwordSchema,
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

type EmailFormData = z.infer<typeof emailSchema>;
type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

/** Logo, title, the form and the picture on the side (large screens) */
const AuthShell = ({
	title,
	subtitle,
	children,
}: {
	title: ReactNode;
	subtitle?: ReactNode;
	children: ReactNode;
}) => (
	<div className="flex flex-col lg:flex-row min-h-screen w-full justify-center items-center">
		<div className="flex flex-col w-full lg:w-1/2 min-h-screen justify-center items-center gap-6 px-4 py-8 lg:px-0">
			<div className="w-full max-w-md lg:w-[50%] flex flex-col">
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
						{title}
						{subtitle}
					</div>
				</div>
				{children}
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

const PasswordField = ({
	label,
	placeholder,
	registration,
}: {
	label: string;
	placeholder: string;
	registration: ReturnType<
		ReturnType<typeof useForm<NewPasswordFormData>>["register"]
	>;
}) => {
	const [isVisible, setIsVisible] = useState(false);
	return (
		<div className="relative">
			<InputField
				{...registration}
				autoComplete="new-password"
				icon={<Lock size={20} />}
				label={label}
				placeholder={placeholder}
				type={isVisible ? "text" : "password"}
			/>
			<button
				aria-label={isVisible ? "Esconder senha" : "Mostrar senha"}
				className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
				type="button"
				onClick={() => {
					setIsVisible(!isVisible);
				}}
			>
				{isVisible ? (
					<EyeOff className="h-5 w-5 text-gray-400" />
				) : (
					<Eye className="h-5 w-5 text-gray-400" />
				)}
			</button>
		</div>
	);
};

/**
 * Forgot the password: the e-mail gets a 6-digit code (valid for 10 minutes,
 * used once) and the code, with the new password, resets it. Back-end changed
 * by Cunha on 24/11/2026: before, the e-mail had a link with a token
 */
function ForgotPasswordComponent() {
	const [step, setStep] = useState<"email" | "code" | "done">("email");
	const [email, setEmail] = useState("");
	const [resendAt, setResendAt] = useState(0);
	const [now, setNow] = useState(() => Date.now());
	const [resendError, setResendError] = useState<string | null>(null);
	const forgotPassword = useForgotPassword();
	const resetPassword = useResetPassword();
	const router = useRouter();

	const emailForm = useForm<EmailFormData>({
		resolver: zodResolver(emailSchema),
	});
	const passwordForm = useForm<NewPasswordFormData>({
		resolver: zodResolver(newPasswordSchema),
		defaultValues: { code: "", password: "", confirmPassword: "" },
	});

	const waitLeft = Math.max(0, (resendAt - now) / 1000);

	// Ticks only while there is a wait to show
	useEffect(() => {
		if (resendAt <= Date.now()) return;
		const timer = setInterval(() => {
			setNow(Date.now());
		}, 1000);
		return () => {
			clearInterval(timer);
		};
	}, [resendAt]);

	// After the reset, the login opens by itself
	useEffect(() => {
		if (step !== "done") return;
		const timer = setTimeout(() => {
			void router.navigate({ to: "/login" });
		}, 3000);
		return () => {
			clearTimeout(timer);
		};
	}, [step, router]);

	const startWait = () => {
		setResendAt(Date.now() + RESEND_WAIT_SECONDS * 1000);
		setNow(Date.now());
	};

	const sendCode = async (data: EmailFormData) => {
		try {
			await forgotPassword.mutateAsync({ email: data.email });
			setEmail(data.email);
			passwordForm.reset();
			startWait();
			setStep("code");
		} catch (error) {
			emailForm.setError("root", {
				message: loginCodeErrorMessage(error, "request"),
			});
		}
	};

	const resendCode = async () => {
		setResendError(null);
		try {
			await forgotPassword.mutateAsync({ email });
			startWait();
		} catch (error) {
			setResendError(loginCodeErrorMessage(error, "request"));
		}
	};

	const saveNewPassword = async (data: NewPasswordFormData) => {
		try {
			await resetPassword.mutateAsync({
				email,
				codigo: normalizeLoginCode(data.code),
				novaSenha: data.password,
			});
			setStep("done");
		} catch (error) {
			passwordForm.setError("root", {
				message: loginCodeErrorMessage(error, "verify"),
			});
		}
	};

	if (step === "done")
		return (
			<AuthShell
				title={
					<div className="flex flex-col gap-4 items-center">
						<CheckCircle className="w-16 h-16 text-green-500" />
						<h1 className="font-semibold text-2xl sm:text-3xl">
							Senha redefinida!
						</h1>
					</div>
				}
				subtitle={
					<p className="text-sm sm:text-base text-gray-600">
						Sua senha foi alterada. Você será levado ao login em instantes...
					</p>
				}
			>
				<Link className="mt-6" to="/login">
					<Button className="w-full font-semibold">Ir para o login</Button>
				</Link>
			</AuthShell>
		);

	if (step === "code") {
		const { errors, isSubmitting } = passwordForm.formState;
		const isSaving = isSubmitting || resetPassword.isPending;
		return (
			<AuthShell
				title={
					<h1 className="font-semibold text-2xl sm:text-3xl">
						Redefinir senha
					</h1>
				}
				subtitle={
					<p className="text-sm sm:text-base text-gray-600" aria-live="polite">
						Enviamos um código para{" "}
						<span className="font-semibold text-gray-800">{email}</span>. Ele
						vale por 10 minutos. Não chegou? Confira o spam.
					</p>
				}
			>
				<form
					noValidate
					className="flex flex-col w-full gap-4 lg:gap-5 pt-4 lg:pt-6"
					onSubmit={passwordForm.handleSubmit(saveNewPassword)}
				>
					<div>
						<InputField
							{...passwordForm.register("code", {
								onChange: (event: { target: { value: string } }) => {
									passwordForm.setValue(
										"code",
										normalizeLoginCode(event.target.value)
									);
								},
							})}
							autoFocus
							autoComplete="one-time-code"
							className="tracking-[0.4em] text-lg font-semibold"
							icon={<KeyRound size={20} />}
							inputMode="numeric"
							label="Código"
							placeholder="000000"
						/>
						{errors.code && (
							<p className="text-red-600 text-sm mt-1">{errors.code.message}</p>
						)}
					</div>

					<div>
						<PasswordField
							label="Nova senha"
							placeholder="Digite sua nova senha"
							registration={passwordForm.register("password")}
						/>
						<PasswordRequirements password={passwordForm.watch("password")} />
						{errors.password && (
							<p className="text-red-600 text-sm mt-1">
								{errors.password.message}
							</p>
						)}
					</div>

					<div>
						<PasswordField
							label="Confirmar nova senha"
							placeholder="Digite novamente sua nova senha"
							registration={passwordForm.register("confirmPassword")}
						/>
						{errors.confirmPassword && (
							<p className="text-red-600 text-sm mt-1">
								{errors.confirmPassword.message}
							</p>
						)}
					</div>

					{(errors.root ?? resendError) && (
						<div className="text-red-600 text-sm text-center" role="alert">
							{errors.root?.message ?? resendError}
						</div>
					)}

					<Button
						className="w-full font-semibold"
						disabled={isSaving}
						type="submit"
					>
						{isSaving ? "Salvando..." : "Salvar nova senha"}
					</Button>

					<div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
						<button
							type="button"
							className="text-primary-600 hover:text-primary-500"
							onClick={() => {
								setResendError(null);
								setStep("email");
							}}
						>
							Trocar e-mail
						</button>
						<button
							type="button"
							className="text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed"
							disabled={waitLeft > 0 || forgotPassword.isPending}
							onClick={() => {
								void resendCode();
							}}
						>
							{forgotPassword.isPending
								? "Enviando..."
								: waitLeft > 0
									? `Reenviar código em ${formatWait(waitLeft)}`
									: "Reenviar código"}
						</button>
					</div>
				</form>
			</AuthShell>
		);
	}

	const { errors, isSubmitting } = emailForm.formState;
	const isSending = isSubmitting || forgotPassword.isPending;
	return (
		<AuthShell
			title={
				<h1 className="font-semibold text-2xl sm:text-3xl">
					Esqueceu sua senha?
				</h1>
			}
			subtitle={
				<h2 className="font-normal text-sm sm:text-base text-gray-500">
					Digite seu e-mail e enviaremos um código de {LOGIN_CODE_LENGTH}{" "}
					dígitos para criar uma senha nova.
				</h2>
			}
		>
			<form
				noValidate
				className="flex flex-col w-full gap-4 lg:gap-5 pt-4 lg:pt-6"
				onSubmit={emailForm.handleSubmit(sendCode)}
			>
				<div>
					<InputField
						{...emailForm.register("email")}
						autoFocus
						autoComplete="email"
						icon={<Mail size={20} />}
						label="Email"
						placeholder="exemplo@vibratto.com"
						type="email"
					/>
					{errors.email && (
						<p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
					)}
				</div>
				{errors.root && (
					<div className="text-red-600 text-sm text-center" role="alert">
						{errors.root.message}
					</div>
				)}
				<Button
					className="w-full font-semibold"
					disabled={isSending}
					type="submit"
				>
					{isSending ? "Enviando..." : "Enviar código"}
				</Button>
			</form>

			<Link
				className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-500 mt-4"
				to="/login"
			>
				<ArrowLeft size={16} />
				Voltar para o login
			</Link>
		</AuthShell>
	);
}

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordComponent,
});

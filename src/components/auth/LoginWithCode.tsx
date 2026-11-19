import { useEffect, useRef, useState, type FormEvent } from "react";
import { KeyRound, Mail } from "lucide-react";
import { z } from "zod";
import type { LoginResponse } from "@/api/types";
import { Button } from "@/components/ui/Button/Button";
import { InputField } from "@/components/forms/InputField/InputField";
import { useLoginWithCode, useRequestLoginCode } from "@/hooks/useUser";
import {
	LOGIN_CODE_LENGTH,
	RESEND_WAIT_SECONDS,
	formatWait,
	isCompleteLoginCode,
	isNoAccountError,
	loginCodeErrorMessage,
	normalizeLoginCode,
} from "@/utils/loginCode";
import { CreateAccountButton } from "./CreateAccountButton";
import {
	DEMO_SIGNUP_CODE,
	EMAIL_CONFIRMATION_LIVE,
} from "@/features/EmailConfirmation/config";

const emailSchema = z.string().trim().email("Email inválido");

interface LoginWithCodeProps {
	/** The e-mail already typed in the login with password, if any */
	initialEmail?: string;
	/**
	 * "login": the login page. "signup": the first step of the sign-up, to
	 * confirm the e-mail (an e-mail that already has an account just enters)
	 */
	purpose?: "login" | "signup";
	/** Same ending as the login with password: user, session and redirect */
	onLoggedIn: (response: LoginResponse) => Promise<void>;
	/** A new e-mail was confirmed: the sign-up goes on with this token */
	onSignupConfirmed: (email: string, signupToken: string) => void;
	/** Back to the login with password, carrying the e-mail typed here */
	onUsePassword?: (email: string) => void;
}

/**
 * Login without password: the e-mail gets a 6-digit code (valid for 10
 * minutes, used once) and the code opens the session. For an e-mail without
 * account the same code confirms it, and the sign-up goes on
 */
export const LoginWithCode = ({
	initialEmail = "",
	purpose = "login",
	onLoggedIn,
	onSignupConfirmed,
	onUsePassword,
}: LoginWithCodeProps) => {
	const [step, setStep] = useState<"email" | "code">("email");
	const [email, setEmail] = useState(initialEmail);
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [resendAt, setResendAt] = useState(0);
	const [now, setNow] = useState(() => Date.now());
	const [isFinishing, setIsFinishing] = useState(false);
	// The e-mail has no account: offer the sign-up with it
	const [hasNoAccount, setHasNoAccount] = useState(false);
	// Demonstration: the API doesn't send codes to new e-mails yet, so the
	// code is simulated (see EmailConfirmation/config)
	const [isDemoSignup, setIsDemoSignup] = useState(false);
	const codeRef = useRef<HTMLInputElement>(null);
	// The code tried last: a full code is sent by itself only once
	const triedCode = useRef("");

	const requestCode = useRequestLoginCode();
	const loginWithCode = useLoginWithCode();

	const waitLeft = Math.max(0, (resendAt - now) / 1000);
	const isBusy = loginWithCode.isPending || isFinishing;

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

	useEffect(() => {
		if (step === "code") codeRef.current?.focus();
	}, [step]);

	const sendCode = async (): Promise<void> => {
		const parsed = emailSchema.safeParse(email);
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message ?? "Email inválido");
			return;
		}

		const goToCode = (isDemo: boolean) => {
			setIsDemoSignup(isDemo);
			setEmail(parsed.data);
			setCode("");
			triedCode.current = "";
			setStep("code");
			setResendAt(Date.now() + RESEND_WAIT_SECONDS * 1000);
			setNow(Date.now());
		};

		setError(null);
		setHasNoAccount(false);
		try {
			await requestCode.mutateAsync(parsed.data);
			goToCode(false);
		} catch (failure) {
			if (!EMAIL_CONFIRMATION_LIVE && isNoAccountError(failure)) {
				goToCode(true);
				return;
			}
			setError(loginCodeErrorMessage(failure, "request"));
			setHasNoAccount(isNoAccountError(failure));
		}
	};

	const enter = async (value: string): Promise<void> => {
		if (!isCompleteLoginCode(value) || isBusy) return;

		triedCode.current = value;
		setError(null);

		if (isDemoSignup) {
			if (value === DEMO_SIGNUP_CODE) onSignupConfirmed(email, "demo");
			else
				setError(`Código incorreto. Na demonstração, use ${DEMO_SIGNUP_CODE}.`);
			return;
		}

		try {
			const result = await loginWithCode.mutateAsync({
				email,
				codigo: value,
			});
			if (result.type === "signup") {
				onSignupConfirmed(email, result.signupToken);
				return;
			}
			setIsFinishing(true);
			await onLoggedIn(result.response);
		} catch (failure) {
			setIsFinishing(false);
			setError(loginCodeErrorMessage(failure, "verify"));
			codeRef.current?.focus();
		}
	};

	const handleCodeChange = (raw: string): void => {
		const value = normalizeLoginCode(raw);
		setCode(value);
		if (error) setError(null);
		// The last digit (or a pasted code) is enough: no need to press Entrar
		if (isCompleteLoginCode(value) && value !== triedCode.current)
			void enter(value);
	};

	const handleSubmit = (event: FormEvent): void => {
		event.preventDefault();
		if (step === "email") void sendCode();
		else void enter(code);
	};

	return (
		<form
			noValidate
			className="flex flex-col w-full gap-4 lg:gap-5 pt-4 lg:pt-6"
			onSubmit={handleSubmit}
		>
			{step === "email" ? (
				<>
					<p className="text-sm text-gray-600 text-center">
						{purpose === "signup"
							? `Antes do cadastro, confirme o seu e-mail: enviaremos um código de ${LOGIN_CODE_LENGTH} dígitos.`
							: `Enviaremos um código de ${LOGIN_CODE_LENGTH} dígitos para o seu e-mail. Não precisa de senha.`}
					</p>
					<InputField
						autoComplete="email"
						name="login-code-email"
						icon={<Mail size={20} />}
						label="Email"
						placeholder="exemplo@vibratto.com"
						type="email"
						value={email}
						onChange={(event) => {
							setEmail(event.target.value);
							if (error) setError(null);
							setHasNoAccount(false);
						}}
					/>
				</>
			) : (
				<>
					<div className="text-sm text-gray-600 text-center" aria-live="polite">
						Enviamos um código para{" "}
						<span className="font-semibold">{email}</span>. Ele vale por 10
						minutos. Não chegou? Confira o spam.
					</div>
					{isDemoSignup && (
						<div
							className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-900"
							role="note"
						>
							<strong>Modo demonstração:</strong> o código para e-mail sem conta
							ainda depende do back-end, então nenhum e-mail foi enviado. Use o
							código <strong>{DEMO_SIGNUP_CODE}</strong>.
						</div>
					)}
					<InputField
						ref={codeRef}
						autoComplete="one-time-code"
						name="login-code"
						icon={<KeyRound size={20} />}
						inputMode="numeric"
						label="Código"
						placeholder="000000"
						className="tracking-[0.4em] text-lg font-semibold"
						value={code}
						disabled={isBusy}
						onChange={(event) => {
							handleCodeChange(event.target.value);
						}}
					/>
				</>
			)}

			{error && (
				<div className="text-red-600 text-sm text-center" role="alert">
					{error}
				</div>
			)}

			{step === "email" && hasNoAccount && purpose === "login" && (
				<CreateAccountButton email={email} />
			)}

			{step === "email" ? (
				<Button
					className="w-full font-semibold"
					disabled={requestCode.isPending}
					type="submit"
				>
					{requestCode.isPending ? "Enviando código..." : "Enviar código"}
				</Button>
			) : (
				<>
					<Button
						className="w-full font-semibold"
						disabled={isBusy || !isCompleteLoginCode(code)}
						type="submit"
					>
						{purpose === "signup"
							? isBusy
								? "Confirmando..."
								: "Confirmar e-mail"
							: isBusy
								? "Entrando..."
								: "Entrar"}
					</Button>

					<div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
						<button
							type="button"
							className="text-primary-600 hover:text-primary-500"
							onClick={() => {
								setStep("email");
								setCode("");
								setError(null);
							}}
						>
							Trocar e-mail
						</button>
						<button
							type="button"
							className="text-primary-600 hover:text-primary-500 disabled:text-gray-400 disabled:cursor-not-allowed"
							disabled={waitLeft > 0 || requestCode.isPending}
							onClick={() => {
								void sendCode();
							}}
						>
							{requestCode.isPending
								? "Enviando..."
								: waitLeft > 0
									? `Reenviar código em ${formatWait(waitLeft)}`
									: "Reenviar código"}
						</button>
					</div>
				</>
			)}

			{onUsePassword && (
				<button
					type="button"
					className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 self-center"
					onClick={() => {
						onUsePassword(email);
					}}
				>
					Entrar com senha
				</button>
			)}
		</form>
	);
};

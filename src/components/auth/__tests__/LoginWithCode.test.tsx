import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VibrattoApiError } from "@/api/middleware/errorHandler";
import { LoginWithCode } from "../LoginWithCode";

const requestCode = vi.fn();
const loginWithCode = vi.fn();

vi.mock("@/hooks/useUser", () => ({
	useRequestLoginCode: () => ({ mutateAsync: requestCode, isPending: false }),
	useLoginWithCode: () => ({ mutateAsync: loginWithCode, isPending: false }),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

const sendCodeTo = async (email: string) => {
	fireEvent.change(screen.getByPlaceholderText("exemplo@vibratto.com"), {
		target: { value: email },
	});
	fireEvent.click(screen.getByText("Enviar código"));
	await screen.findByPlaceholderText("000000");
};

const typeCode = (code: string) => {
	fireEvent.change(screen.getByPlaceholderText("000000"), {
		target: { value: code },
	});
};

const renderSignup = () => {
	const onSignupConfirmed = vi.fn();
	const onLoggedIn = vi.fn().mockResolvedValue(undefined);
	render(
		<LoginWithCode
			purpose="signup"
			onLoggedIn={onLoggedIn}
			onSignupConfirmed={onSignupConfirmed}
		/>
	);
	return { onSignupConfirmed, onLoggedIn };
};

describe("LoginWithCode confirming the e-mail before the sign-up", () => {
	it("a new e-mail gets the code and the sign-up goes on with tokenCadastro", async () => {
		requestCode.mockResolvedValueOnce({
			mensagem: "Código enviado para o seu e-mail.",
		});
		loginWithCode.mockResolvedValueOnce({
			type: "signup",
			signupToken: "f0cbfcf9",
		});
		const { onSignupConfirmed, onLoggedIn } = renderSignup();

		await sendCodeTo("nova@exemplo.com");
		typeCode("750005");

		await waitFor(() => {
			expect(onSignupConfirmed).toHaveBeenCalledWith(
				"nova@exemplo.com",
				"f0cbfcf9"
			);
		});
		expect(loginWithCode).toHaveBeenCalledWith({
			email: "nova@exemplo.com",
			codigo: "750005",
		});
		expect(onLoggedIn).not.toHaveBeenCalled();
	});

	it("an e-mail with account just enters", async () => {
		requestCode.mockResolvedValueOnce({ mensagem: "ok" });
		loginWithCode.mockResolvedValueOnce({
			type: "login",
			response: { Token: "jwt", token: "jwt" },
		});
		const { onSignupConfirmed, onLoggedIn } = renderSignup();

		await sendCodeTo("ana@exemplo.com");
		typeCode("207758");

		await waitFor(() => {
			expect(onLoggedIn).toHaveBeenCalledWith({ Token: "jwt", token: "jwt" });
		});
		expect(onSignupConfirmed).not.toHaveBeenCalled();
	});

	it("a wrong code shows the API's reason and doesn't go on", async () => {
		requestCode.mockResolvedValueOnce({ mensagem: "ok" });
		loginWithCode.mockRejectedValueOnce(
			new VibrattoApiError({
				code: "X",
				message: "x",
				statusCode: 400,
				data: { erros: ["Código inválido ou expirado."] } as never,
				timestamp: "",
			})
		);
		const { onSignupConfirmed } = renderSignup();

		await sendCodeTo("nova@exemplo.com");
		typeCode("111111");

		expect((await screen.findByRole("alert")).textContent).toBeTruthy();
		expect(onSignupConfirmed).not.toHaveBeenCalled();
	});
});

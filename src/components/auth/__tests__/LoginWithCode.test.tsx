import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VibrattoApiError } from "@/api/middleware/errorHandler";
import { LoginWithCode } from "../LoginWithCode";

const noAccount = new VibrattoApiError({
	code: "X",
	message: "x",
	statusCode: 400,
	data: { erros: ["Email não cadastrado."] } as never,
	timestamp: "",
});

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

// Demonstration (EMAIL_CONFIRMATION_LIVE = false): the API doesn't send codes
// to new e-mails yet, so the code is simulated
describe("LoginWithCode confirming a new e-mail (demonstration)", () => {
	it("simulates the code for an e-mail without account", async () => {
		requestCode.mockRejectedValueOnce(noAccount);
		const onSignupConfirmed = vi.fn();
		render(
			<LoginWithCode
				purpose="signup"
				onLoggedIn={vi.fn()}
				onSignupConfirmed={onSignupConfirmed}
			/>
		);

		await sendCodeTo("nova@exemplo.com");
		expect(screen.getByText(/Modo demonstração/)).toBeTruthy();

		fireEvent.change(screen.getByPlaceholderText("000000"), {
			target: { value: "123456" },
		});

		expect(onSignupConfirmed).toHaveBeenCalledWith("nova@exemplo.com", "demo");
		expect(loginWithCode).not.toHaveBeenCalled();
	});

	it("refuses another code in the demonstration", async () => {
		requestCode.mockRejectedValueOnce(noAccount);
		const onSignupConfirmed = vi.fn();
		render(
			<LoginWithCode
				purpose="signup"
				onLoggedIn={vi.fn()}
				onSignupConfirmed={onSignupConfirmed}
			/>
		);

		await sendCodeTo("nova@exemplo.com");
		fireEvent.change(screen.getByPlaceholderText("000000"), {
			target: { value: "654321" },
		});

		expect(screen.getByRole("alert").textContent).toContain("123456");
		expect(onSignupConfirmed).not.toHaveBeenCalled();
	});

	it("an e-mail with account still enters for real", async () => {
		requestCode.mockResolvedValueOnce({ mensagem: "ok" });
		loginWithCode.mockResolvedValueOnce({
			type: "login",
			response: { Token: "jwt", token: "jwt" },
		});
		const onLoggedIn = vi.fn().mockResolvedValue(undefined);
		render(
			<LoginWithCode
				purpose="signup"
				onLoggedIn={onLoggedIn}
				onSignupConfirmed={vi.fn()}
			/>
		);

		await sendCodeTo("ana@exemplo.com");
		expect(screen.queryByText(/Modo demonstração/)).toBeNull();
		fireEvent.change(screen.getByPlaceholderText("000000"), {
			target: { value: "207758" },
		});

		await waitFor(() => {
			expect(onLoggedIn).toHaveBeenCalledWith({ Token: "jwt", token: "jwt" });
		});
	});
});

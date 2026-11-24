import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VibrattoApiError } from "@/api/middleware/errorHandler";

const forgotPassword = vi.fn();
const resetPassword = vi.fn();
const navigate = vi.fn();

vi.mock("@/hooks/useUser", () => ({
	useForgotPassword: () => ({ mutateAsync: forgotPassword, isPending: false }),
	useResetPassword: () => ({ mutateAsync: resetPassword, isPending: false }),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => options,
	useRouter: () => ({ navigate }),
	Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const { Route } = await import("../forgot-password");
const ForgotPassword = (Route as unknown as { component: () => JSX.Element })
	.component;

const type = (label: string | RegExp, value: string) => {
	fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const askForCode = async () => {
	render(<ForgotPassword />);
	type("Email", "ana@exemplo.com");
	fireEvent.click(screen.getByText("Enviar código"));
	await screen.findByText("Salvar nova senha");
};

describe("forgot the password (code by e-mail)", () => {
	beforeEach(() => {
		forgotPassword.mockReset().mockResolvedValue(undefined);
		resetPassword.mockReset().mockResolvedValue(undefined);
	});

	it("sends the code, then saves the new password with e-mail and code", async () => {
		await askForCode();
		expect(forgotPassword).toHaveBeenCalledWith({ email: "ana@exemplo.com" });

		type("Código", "0 8 2 3 9 6");
		type("Nova senha", "Violao#Azul42");
		type("Confirmar nova senha", "Violao#Azul42");
		fireEvent.click(screen.getByText("Salvar nova senha"));

		await screen.findByText("Senha redefinida!");
		expect(resetPassword).toHaveBeenCalledWith({
			email: "ana@exemplo.com",
			codigo: "082396",
			novaSenha: "Violao#Azul42",
		});
	});

	it("doesn't send without the full code", async () => {
		await askForCode();

		type("Código", "0823");
		type("Nova senha", "Violao#Azul42");
		type("Confirmar nova senha", "Violao#Azul42");
		fireEvent.click(screen.getByText("Salvar nova senha"));

		await screen.findByText("O código tem 6 dígitos");
		expect(resetPassword).not.toHaveBeenCalled();
	});

	it("shows the API's reason for a wrong or expired code", async () => {
		resetPassword.mockRejectedValueOnce(
			new VibrattoApiError({
				code: "X",
				message: "x",
				statusCode: 400,
				data: { erros: ["Código inválido ou expirado."] } as never,
				timestamp: "",
			})
		);
		await askForCode();

		type("Código", "111111");
		type("Nova senha", "Violao#Azul42");
		type("Confirmar nova senha", "Violao#Azul42");
		fireEvent.click(screen.getByText("Salvar nova senha"));

		await waitFor(() => {
			expect(screen.getByRole("alert").textContent).toBe(
				"Código inválido ou expirado."
			);
		});
		expect(screen.queryByText("Senha redefinida!")).toBeNull();
	});
});

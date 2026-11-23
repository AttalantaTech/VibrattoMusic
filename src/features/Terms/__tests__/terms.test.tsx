import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VibrattoApiError } from "@/api/middleware/errorHandler";
import { needsAcceptance } from "../utils/termStatus";
import { termErrorMessage } from "../utils/termError";
import { TermsDialog } from "../components/TermsDialog";

const apiError = (statusCode: number, erros?: Array<string>) =>
	new VibrattoApiError({
		code: "X",
		message: "x",
		statusCode,
		data: (erros ? { erros } : undefined) as never,
		timestamp: "",
	});

describe("when the person has to accept a term", () => {
	it("asks while the current version isn't accepted", () => {
		expect(
			needsAcceptance({ assinado: false, versao: 2, texto: "<p>Termo</p>" })
		).toBe(true);
	});

	it("doesn't ask once accepted (the API sends only assinado: true)", () => {
		expect(needsAcceptance({ assinado: true })).toBe(false);
	});

	it("doesn't block anyone while the term isn't registered (404)", () => {
		expect(needsAcceptance(null)).toBe(false);
		expect(needsAcceptance(undefined)).toBe(false);
	});

	it("doesn't ask for a term without a version, which can't be signed", () => {
		expect(needsAcceptance({ assinado: false })).toBe(false);
	});

	it("shows the API's reason when accepting fails", () => {
		expect(termErrorMessage(apiError(400, ["Versão inválida."]))).toBe(
			"Versão inválida."
		);
		expect(termErrorMessage(apiError(500, ["stack trace"]))).toBe(
			"Não foi possível registrar o aceite. Tente novamente."
		);
	});
});

const renderDialog = (
	props: Partial<Parameters<typeof TermsDialog>[0]> = {}
) => {
	const onAccept = vi.fn();
	const onSecondary = vi.fn();
	render(
		<TermsDialog
			isOpen
			code="TERMOS_USO"
			version={2}
			html={'<p>Texto do termo</p><img src="x" onerror="alert(1)">'}
			isSigning={false}
			error={null}
			secondaryLabel="Sair da conta"
			onAccept={onAccept}
			onSecondary={onSecondary}
			isDismissible={false}
			{...props}
		/>
	);
	return { onAccept, onSecondary };
};

describe("TermsDialog", () => {
	it("shows the term and its version", () => {
		renderDialog();

		expect(screen.getByText("Termos de uso da Vibratto")).toBeTruthy();
		expect(screen.getByText("Texto do termo")).toBeTruthy();
		expect(screen.getByText("(versão 2)")).toBeTruthy();
	});

	it("accepts only after 'Li e aceito' is checked", () => {
		const { onAccept } = renderDialog();
		const accept = screen.getByText("Aceitar").closest("button")!;

		expect(accept.disabled).toBe(true);
		fireEvent.click(accept);
		expect(onAccept).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("checkbox"));
		expect(accept.disabled).toBe(false);
		fireEvent.click(accept);
		expect(onAccept).toHaveBeenCalledOnce();
	});

	it("drops code hidden in the term's HTML", () => {
		renderDialog();

		expect(document.body.innerHTML).not.toContain("onerror");
	});

	it("terms of use: no X to close, only the buttons", () => {
		const { onSecondary } = renderDialog();

		fireEvent.keyDown(document.activeElement ?? document.body, {
			key: "Escape",
		});
		expect(onSecondary).not.toHaveBeenCalled();

		fireEvent.click(screen.getByText("Sair da conta"));
		expect(onSecondary).toHaveBeenCalledOnce();
	});
});

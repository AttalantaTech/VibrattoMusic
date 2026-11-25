import { describe, expect, it } from "vitest";
import { formatPageTitle, pageNameFor } from "../pageTitle";

describe("browser tab title", () => {
	it("page first, then the brand; no page: just the brand", () => {
		expect(formatPageTitle("Mensagens")).toBe("Mensagens · Vibratto Music");
		expect(formatPageTitle("")).toBe("Vibratto Music");
		expect(formatPageTitle(null)).toBe("Vibratto Music");
	});

	it("names the public pages", () => {
		expect(pageNameFor("/")).toBe("");
		expect(pageNameFor("/search")).toBe("Buscar artistas");
		expect(pageNameFor("/login")).toBe("Entrar");
		expect(pageNameFor("/register")).toBe("Criar conta");
		expect(pageNameFor("/forgot-password")).toBe("Recuperar senha");
		expect(pageNameFor("/proposta/abc-123")).toBe("Proposta");
	});

	it("the logged-in area follows the open tab (messages by default)", () => {
		expect(pageNameFor("/band/me")).toBe("Mensagens");
		expect(pageNameFor("/band/me", { tab: "bookings" })).toBe("Agenda");
		expect(pageNameFor("/band/me", { tab: "sales" })).toBe("Vendas");
		expect(pageNameFor("/band/me", { tab: "contracts" })).toBe(
			"Modelos de Contratos"
		);
		expect(pageNameFor("/band/me", { tab: "settings" })).toBe("Ajustes");
	});

	it("the profile sign-up steps share one name", () => {
		expect(pageNameFor("/band/register/onboarding/3")).toBe(
			"Cadastro do perfil"
		);
		expect(pageNameFor("/band/profile-type")).toBe("Cadastro do perfil");
	});

	it("a band's public profile names itself with the band (null)", () => {
		expect(pageNameFor("/band/profile/878")).toBeNull();
	});

	it("an address without a name gets only the brand", () => {
		expect(pageNameFor("/qualquer-coisa")).toBe("");
		expect(pageNameFor("/search/")).toBe("Buscar artistas");
	});
});

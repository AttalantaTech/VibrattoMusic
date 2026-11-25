import { describe, expect, it } from "vitest";
import {
	countUnreadConversations,
	formatPageTitle,
	pageNameFor,
	withUnreadCount,
} from "../pageTitle";

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

	it("a band's public profile: a placeholder until the band's name arrives", () => {
		expect(pageNameFor("/band/profile/878")).toBe("Perfil do artista");
	});

	it("conversations with unread messages go in front, up to 9+", () => {
		expect(withUnreadCount("Mensagens · Vibratto Music", 3)).toBe(
			"(3) Mensagens · Vibratto Music"
		);
		expect(withUnreadCount("Vibratto Music", 12)).toBe("(9+) Vibratto Music");
		expect(withUnreadCount("Vibratto Music", 0)).toBe("Vibratto Music");
	});

	it("counts conversations with unread messages, not the messages", () => {
		expect(
			countUnreadConversations([
				{ numeroMensagensNaoLidas: 4 },
				{ numeroMensagensNaoLidas: 0 },
				{ numeroMensagensNaoLidas: 1 },
				{ numeroMensagensNaoLidas: null },
			])
		).toBe(2);
		expect(countUnreadConversations(undefined)).toBe(0);
	});

	it("an address without a name gets only the brand", () => {
		expect(pageNameFor("/qualquer-coisa")).toBe("");
		expect(pageNameFor("/search/")).toBe("Buscar artistas");
	});
});

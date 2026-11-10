import { describe, expect, it } from "vitest";
import { buildSenderPayload } from "../senderPayload";

// Who signs a status card: decides the side it appears on in the chat
describe("sender of a status card", () => {
	it("a contractor without professional profile sends as the user", () => {
		expect(
			buildSenderPayload("produtoMusical", {
				produtoMusicalId: 879,
				produtoMusicalContratanteId: null,
			})
		).toEqual({ IdProdutoMusical: null, TipoRemetente: 1 });
	});

	it("a professional profile hiring another one sends as its product", () => {
		expect(
			buildSenderPayload("produtoMusical", {
				produtoMusicalId: 879,
				produtoMusicalContratanteId: 878,
			})
		).toEqual({ IdProdutoMusical: 878, TipoRemetente: 2 });
	});

	it("the hired product sends as itself to a contractor", () => {
		expect(
			buildSenderPayload("contratante", {
				produtoMusicalId: 879,
				produtoMusicalContratanteId: null,
			})
		).toEqual({ IdProdutoMusical: 879, TipoRemetente: 2 });
	});

	it("the hired product sends as itself to a contractor product", () => {
		expect(
			buildSenderPayload("produtoContratante", {
				produtoMusicalId: 879,
				produtoMusicalContratanteId: 878,
			})
		).toEqual({ IdProdutoMusical: 879, TipoRemetente: 2 });
	});
});

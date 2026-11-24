import { describe, expect, it } from "vitest";
import {
	budgetRequestFilters,
	pendingBadgeLabel,
} from "../budgetRequestFilters";

describe("budget requests of one conversation", () => {
	it("conversation with a client: only that client's own requests", () => {
		expect(
			budgetRequestFilters({
				produtoMusicalId: 878,
				produtoMusicalContratanteId: null,
				contratanteId: 63,
			})
		).toEqual({
			IdContratante: 63,
			IdProdutoMusicalContratante: null,
			IdProdutoMusical: 878,
			onlyDirectRequests: true,
		});
	});

	it("conversation with another professional profile: only that profile's requests", () => {
		expect(
			budgetRequestFilters({
				produtoMusicalId: 878,
				produtoMusicalContratanteId: 880,
				contratanteId: 63,
			})
		).toEqual({
			IdContratante: null,
			IdProdutoMusicalContratante: 880,
			IdProdutoMusical: 878,
			onlyDirectRequests: false,
		});
	});

	it("the badge shows the number, up to 9+", () => {
		expect(pendingBadgeLabel(1)).toBe("1");
		expect(pendingBadgeLabel(9)).toBe("9");
		expect(pendingBadgeLabel(10)).toBe("9+");
	});
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ProposalResponse } from "@/api/types";

let linkId: number | undefined;
const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
	useSearch: () => ({ id: linkId }),
	useNavigate: () => navigate,
}));

let linked: ProposalResponse | undefined;
vi.mock("@/hooks/useProposals", () => ({
	useProposalByNumber: () => ({ data: linked, isError: false }),
}));

let activeProduct: { id: number } | null = null;
vi.mock("@/store/musicalProduct/useMusicalProductStore", () => ({
	useMusicalProductStore: () => ({ activeProduct }),
}));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), error: vi.fn() } }));

import { toast } from "sonner";
import { useProposalFromLink } from "../useProposalFromLink";

const proposal = (id: number, replaces: number | null = null) =>
	({
		id,
		idPropostaGerouContraProposta: replaces,
		produtoMusical: { id: 3, nome: "Banda" },
	}) as unknown as ProposalResponse;

// "Ver proposta" (/band/me?tab=…&id=123) opens that proposal's details
describe("useProposalFromLink", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		activeProduct = null;
	});

	it("opens the proposal of the link and clears it from the URL", () => {
		linkId = 10;
		linked = proposal(10);
		const onOpen = vi.fn();

		renderHook(() =>
			useProposalFromLink({ tab: "hires", proposals: [linked!], onOpen })
		);

		expect(onOpen).toHaveBeenCalledWith(linked);
		expect(navigate).toHaveBeenCalledWith(
			expect.objectContaining({ search: { tab: "hires" }, replace: true })
		);
	});

	it("opens the latest version when it was edited or answered twice", () => {
		linkId = 10;
		linked = proposal(10);
		const v2 = proposal(11, 10);
		const v3 = proposal(12, 11);
		const onOpen = vi.fn();

		renderHook(() =>
			useProposalFromLink({
				tab: "hires",
				proposals: [v3, v2],
				onOpen,
			})
		);

		expect(onOpen).toHaveBeenCalledWith(v3);
		expect(toast.info).toHaveBeenCalled();
	});

	it("sends the band to Vendas when the link landed on Contratações", () => {
		linkId = 10;
		linked = proposal(10);
		activeProduct = { id: 3 };
		const onOpen = vi.fn();

		renderHook(() =>
			useProposalFromLink({ tab: "hires", proposals: [], onOpen })
		);

		expect(onOpen).not.toHaveBeenCalled();
		expect(navigate).toHaveBeenCalledWith(
			expect.objectContaining({ search: { tab: "sales", id: 10 } })
		);
	});

	it("does nothing without a proposal in the link", () => {
		linkId = undefined;
		linked = undefined;
		const onOpen = vi.fn();

		renderHook(() =>
			useProposalFromLink({ tab: "sales", proposals: [], onOpen })
		);

		expect(onOpen).not.toHaveBeenCalled();
		expect(navigate).not.toHaveBeenCalled();
	});
});

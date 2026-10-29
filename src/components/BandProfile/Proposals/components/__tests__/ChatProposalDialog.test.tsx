import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/components/PdfViewer/PdfViewer", () => ({
	PdfViewer: () => <div>PDF</div>,
}));

let status = "Pendente";
vi.mock("@/hooks/useProposals", () => ({
	useProposalByNumber: (id: number | null) => ({
		data: id
			? {
					id,
					identificadorUnico: "abc",
					status: { id: 1, nome: status },
					dataCriacao: "2026-10-29",
					contratante: { id: 7, nome: "Maria" },
					nomeContratante: "",
					produtoMusical: { id: 3, nome: "Banda" },
					produtoMusicalContratante: { id: 0, nome: "" },
					condicoesPagamento: { id: 2, nome: "" },
					valor: 1000,
					tipoSinalPagamento: null,
					valorSinalPagamento: null,
					motivoRejeicao: null,
				}
			: undefined,
		isError: false,
	}),
	useProposalPDF: () => ({ data: "blob:pdf", isLoading: false }),
}));

const actions = {
	accept: vi.fn(),
	cancel: vi.fn(),
	confirmPaidSign: vi.fn(() => Promise.resolve(true)),
	isLoadingAccept: false,
	isLoadingCancel: false,
	isLoadingPaidSign: false,
};
vi.mock("../../hooks/useProposalActions", () => ({
	useProposalActions: () => actions,
}));
vi.mock("../ProposalRejectionModal", () => ({
	ProposalRejectionModal: ({ isOpen }: { isOpen: boolean }) =>
		isOpen ? <div>janela de rejeição</div> : null,
}));

let user = { id: 7 };
let activeProduct: { id: number } | null = null;
vi.mock("@/store/authStore", () => ({ useAuthStore: () => ({ user }) }));
vi.mock("@/store/musicalProduct/useMusicalProductStore", () => ({
	useMusicalProductStore: () => ({ activeProduct }),
}));

import { ChatProposalDialog } from "../ChatProposalDialog";

const asContractor = () => {
	user = { id: 7 };
	activeProduct = null;
};
const asBand = () => {
	user = { id: 99 };
	activeProduct = { id: 3 };
};

// "Ver proposta" in the chat opens the proposal with its actions
describe("ChatProposalDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("the contractor accepts a pending proposal from the chat", async () => {
		status = "Pendente";
		asContractor();
		render(
			<ChatProposalDialog proposalId={10} isSeller={false} onClose={vi.fn()} />
		);

		fireEvent.click(screen.getByText("Aceitar"));

		await waitFor(() => {
			expect(actions.accept).toHaveBeenCalled();
		});
	});

	it("the contractor rejects through the reason dialog", () => {
		status = "Pendente";
		asContractor();
		render(
			<ChatProposalDialog proposalId={10} isSeller={false} onClose={vi.fn()} />
		);

		fireEvent.click(screen.getByText("Rejeitar Proposta"));

		expect(screen.getByText("janela de rejeição")).toBeTruthy();
	});

	it("the band confirms the down payment only after the confirmation", async () => {
		status = "AguardandoPagamento";
		asBand();
		render(<ChatProposalDialog proposalId={11} isSeller onClose={vi.fn()} />);

		fireEvent.click(screen.getByText("Confirmar Recebimento do Sinal"));
		expect(actions.confirmPaidSign).not.toHaveBeenCalled();

		fireEvent.click(await screen.findByText("Confirmar Recebimento"));

		await waitFor(() => {
			expect(actions.confirmPaidSign).toHaveBeenCalled();
		});
	});

	it("the band doesn't see the contractor's buttons", () => {
		status = "Pendente";
		asBand();
		render(<ChatProposalDialog proposalId={12} isSeller onClose={vi.fn()} />);

		expect(screen.queryByText("Aceitar")).toBeNull();
		expect(screen.queryByText("Rejeitar Proposta")).toBeNull();
	});

	it("stays closed without a proposal", () => {
		render(
			<ChatProposalDialog
				proposalId={null}
				isSeller={false}
				onClose={vi.fn()}
			/>
		);

		expect(screen.queryByText("Detalhes da Proposta")).toBeNull();
	});
});

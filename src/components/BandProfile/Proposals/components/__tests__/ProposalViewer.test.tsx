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
					possuiSinalPagamento: true,
					sinalPago: false,
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

vi.mock("@/hooks/useContracts", () => ({
	useContractPDF: () => ({ data: "blob:contrato", isLoading: false }),
	useContractSections: () => ({ data: [] }),
}));

import { ProposalViewer } from "../ProposalViewer";

const asContractor = () => {
	user = { id: 7 };
	activeProduct = null;
};
const asBand = () => {
	user = { id: 99 };
	activeProduct = { id: 3 };
};

// Progress, proposal and contract over the chat, Vendas and Contratações,
// with tabs between them and each one's actions
describe("ProposalViewer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("the contractor accepts a pending proposal from the chat", async () => {
		status = "Pendente";
		asContractor();
		render(
			<ProposalViewer proposalId={10} isSeller={false} onClose={vi.fn()} />
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
			<ProposalViewer proposalId={10} isSeller={false} onClose={vi.fn()} />
		);

		fireEvent.click(screen.getByText("Rejeitar Proposta"));

		expect(screen.getByText("janela de rejeição")).toBeTruthy();
	});

	it("the band confirms the down payment only after the confirmation", async () => {
		status = "AguardandoPagamento";
		asBand();
		render(<ProposalViewer proposalId={11} isSeller onClose={vi.fn()} />);

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
		render(<ProposalViewer proposalId={12} isSeller onClose={vi.fn()} />);

		expect(screen.queryByText("Aceitar")).toBeNull();
		expect(screen.queryByText("Rejeitar Proposta")).toBeNull();
	});

	it("switches to the contract and back without leaving the screen", () => {
		status = "Aceita";
		asBand();
		render(<ProposalViewer proposalId={13} isSeller onClose={vi.fn()} />);

		fireEvent.click(screen.getByRole("tab", { name: /Contrato/ }));
		expect(screen.getByText("Baixar Contrato")).toBeTruthy();

		fireEvent.click(screen.getByRole("tab", { name: /Proposta/ }));
		expect(screen.getByText("Detalhes da Proposta")).toBeTruthy();
	});

	it("before the acceptance there is no contract tab", () => {
		status = "Pendente";
		asContractor();
		render(
			<ProposalViewer
				proposalId={14}
				initialView="contract"
				isSeller={false}
				onClose={vi.fn()}
			/>
		);

		expect(screen.queryByRole("tab", { name: /Contrato/ })).toBeNull();
		// An old "Ver contrato" link falls back to the proposal
		expect(screen.getByText("Detalhes da Proposta")).toBeTruthy();
	});

	it("the band confirms the down payment from the contract too", async () => {
		status = "Aceita";
		asBand();
		render(
			<ProposalViewer
				proposalId={15}
				initialView="contract"
				isSeller
				onClose={vi.fn()}
			/>
		);

		fireEvent.click(screen.getByText("Confirmar Recebimento do Sinal"));
		fireEvent.click(await screen.findByText("Confirmar Recebimento"));

		await waitFor(() => {
			expect(actions.confirmPaidSign).toHaveBeenCalled();
		});
	});

	it("opens on the progress from the chat card", () => {
		status = "Aceita";
		asContractor();
		render(
			<ProposalViewer
				proposalId={16}
				initialView="progress"
				isSeller={false}
				onClose={vi.fn()}
			/>
		);

		expect(screen.getByText("Andamento da contratação")).toBeTruthy();
	});

	it("stays closed without a proposal", () => {
		render(
			<ProposalViewer proposalId={null} isSeller={false} onClose={vi.fn()} />
		);

		expect(screen.queryByText("Detalhes da Proposta")).toBeNull();
	});
});

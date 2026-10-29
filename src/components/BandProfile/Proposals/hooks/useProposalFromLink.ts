import { useEffect, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { useProposalByNumber } from "@/hooks/useProposals";
import type { ProposalResponse } from "@/api/types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

interface UseProposalFromLinkParameters {
	tab: "sales" | "hires";
	/** Proposals already listed by the tab, used to find a newer version */
	proposals: Array<ProposalResponse> | undefined;
	onOpen: (proposal: ProposalResponse) => void;
}

// Editing a proposal or answering it with a counter-proposal creates a new one
// and the old becomes "Substituida"; follow the chain to the current version
const latestVersion = (
	proposal: ProposalResponse,
	proposals: Array<ProposalResponse>
) => {
	let current = proposal;
	const seen = new Set<number>([current.id]);

	for (;;) {
		const newer = proposals.find(
			(p) => p.idPropostaGerouContraProposta === current.id && !seen.has(p.id)
		);
		if (!newer) return current;
		seen.add(newer.id);
		current = newer;
	}
};

/**
 * Opens the proposal of a "Ver proposta" link (/band/me?tab=…&id=123): the
 * link used to land on the tab and leave the user looking for it in the list
 */
export const useProposalFromLink = ({
	tab,
	proposals,
	onOpen,
}: UseProposalFromLinkParameters) => {
	const { id } = useSearch({ from: "/band/me" });
	const navigate = useNavigate();
	const { activeProduct } = useMusicalProductStore();
	const handledId = useRef<number | null>(null);

	const { data: linked, isError } = useProposalByNumber(id);

	useEffect(() => {
		if (!id || handledId.current === id) return;

		const clearLink = () => {
			handledId.current = id;
			void navigate({ to: "/band/me", search: { tab }, replace: true });
		};

		if (isError) {
			toast.error("Não foi possível abrir a proposta deste link.");
			clearLink();
			return;
		}
		if (!linked || !proposals) return;

		// Links opened outside the chat always point to Contratações; the
		// seller's side of the proposal lives in Vendas
		if (tab === "hires" && linked.produtoMusical.id === activeProduct?.id) {
			handledId.current = id;
			void navigate({
				to: "/band/me",
				search: { tab: "sales", id },
				replace: true,
			});
			return;
		}

		const current = latestVersion(linked, proposals);
		if (current.id !== linked.id) {
			toast.info("Abrimos a versão mais recente desta proposta.");
		}

		clearLink();
		onOpen(current);
	}, [
		id,
		linked,
		isError,
		proposals,
		tab,
		activeProduct?.id,
		navigate,
		onOpen,
	]);
};

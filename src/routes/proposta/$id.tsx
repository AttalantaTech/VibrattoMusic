import { createFileRoute } from "@tanstack/react-router";
import { PublicProposal } from "../../pages/Proposal/PublicProposal";

// Public page (no login): standalone proposals are sent to people who don't
// have an account. $id is the proposal's identificadorUnico, not the numeric id
export const Route = createFileRoute("/proposta/$id")({
	component: PublicProposal,
});

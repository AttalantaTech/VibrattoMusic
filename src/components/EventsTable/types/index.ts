import type { BudgetResponse } from "@/api/types";
import type { ReactElement } from "react";

export type EventsTableHiresRow = {
	event: {
		id: string;
		title: string;
		date: string;
		/** Second line; the creation date when absent */
		subtitle?: string;
	};
	status: string;
	statusComponent: ReactElement;
	productName: string;
	value: number;
	canSign: boolean;
	onSeeProposal: (proposalId: string) => void;
	onSeeContract: (proposalId: string) => void;
};

export type EventsTableSaleRow = {
	event: {
		id: string;
		title: string;
		date: string;
		/** Second line; the creation date when absent */
		subtitle?: string;
	};
	aceitaContraProposta: boolean;
	status: string;
	statusComponent: ReactElement;
	clientName: string;
	value: number;
	canSign: boolean;
	onCounterProposal: (proposalId: string) => void;
	onSeeProposal: (proposalId: string) => void;
	onSeeContract: (proposalId: string) => void;
	onEditContract: (proposalId: string) => void;
	onShareProposal: (proposalId: string) => void;
	// Only set while the proposal is waiting for the down payment
	onConfirmDownPayment?: (proposalId: string) => void;
};

export type EventsTableBudgetsRow = {
	budget: BudgetResponse;
	createProposal: (budget: BudgetResponse) => void;
};

export type EventsTableHiresData = Array<EventsTableHiresRow>;
export type EventsTableSaleData = Array<EventsTableSaleRow>;
export type EventsTableBudgetsData = Array<EventsTableBudgetsRow>;

import type { ReactElement } from "react";

export type EventsTableHiresRow = {
	event: {
		id: string;
		title: string;
		date: string;
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
};

export type EventsTableHiresData = Array<EventsTableHiresRow>;
export type EventsTableSaleData = Array<EventsTableSaleRow>;

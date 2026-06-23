import type { ReactElement } from "react";

export type EventsTableProposalRow = {
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
	onSign: (proposalId: string) => void;
	onSeeContract: (proposalId: string) => void;
};

export type EventsTableSaleRow = {
	event: {
		id: string;
		title: string;
		date: string;
	};
	status: string;
	statusComponent: ReactElement;
	clientName: string;
	value: number;
	canSign: boolean;
	onSign: (proposalId: string) => void;
	onSeeContract: (proposalId: string) => void;
	onEditContract: (proposalId: string) => void;
};

export type EventsTableProposalData = Array<EventsTableProposalRow>;
export type EventsTableSaleData = Array<EventsTableSaleRow>;

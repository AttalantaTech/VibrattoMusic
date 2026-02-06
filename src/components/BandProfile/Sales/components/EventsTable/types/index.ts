import type { ReactElement } from "react";

export type EventsTableRow = {
	event: {
		id: string;
		title: string;
		date: string;
	};
	paymentStatus: string;
	paymentStatusComponent: ReactElement;
	clientName: string;
	productName: string;
	value: number;
	canSign: boolean;
	onSign: (proposalId: string) => void;
	onSeeContract: (proposalId: string) => void;
	onEditContract: (proposalId: string) => void;
	onReject: (proposalId: string) => void;
};

export type EventsTableData = Array<EventsTableRow>;

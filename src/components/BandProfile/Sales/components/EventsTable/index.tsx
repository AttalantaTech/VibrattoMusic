import { createColumnHelper } from "@tanstack/react-table";
import { Ellipsis, Eye, Pen, PenTool, ScanEye } from "lucide-react";
import type {
	EventsTableProposalData,
	EventsTableProposalRow,
	EventsTableSaleData,
	EventsTableSaleRow,
} from "./types";
import { GenericTable } from "../../../../ui/Table/Table";
import { TableIconButton } from "./components/TableIconButton";
import { Dropdown } from "../../../../ui/Dropdown/Dropdown";
import { MoreOptionsDropdownItem } from "./components/MoreOptionsDropdownItem";
import { QuickActionIconButton } from "./components/QuickActionIconButton";
import { formatDate } from "../../../../../utils/validation";

interface EventsTableProps {
	dataSales?: EventsTableSaleData;
	dataProposals?: EventsTableProposalData;
	pageSize?: number;
	mode?: "proposal" | "sale";
}

const columnHelperProposal = createColumnHelper<EventsTableProposalRow>();

const columnsProposal = [
	columnHelperProposal.accessor("event", {
		header: "Evento",
		cell: (info) => {
			const event = info.getValue<EventsTableProposalRow["event"]>();
			return (
				<div className="flex flex-col">
					<div className="font-medium text-gray-900">{event.title}</div>
					<div className="text-gray-500">{formatDate(event.date)}</div>
				</div>
			);
		},
	}),
	columnHelperProposal.accessor("statusComponent", {
		header: "Status",
		cell: (info) => {
			const StatusComponent = info.getValue();
			return StatusComponent;
		},
	}),
	columnHelperProposal.accessor("productName", {
		header: "Artista/Banda",
	}),
	columnHelperProposal.accessor("value", {
		header: "Valor",
		cell: (info) => `R$ ${info.getValue()}`,
	}),
	columnHelperProposal.display({
		id: "quickActions",
		cell: ({ row }) => {
			const canSign = row.original.canSign;
			const onSign = row.original.onSign;
			return (
				<div className="min-w-[100px]">
					{canSign && (
						<QuickActionIconButton
							onClick={() => {
								onSign(row.original.event.id);
							}}
						>
							<PenTool size={16} className="mr-1" />
							<p>Visualizar Contrato</p>
						</QuickActionIconButton>
					)}
				</div>
			);
		},
	}),
	columnHelperProposal.display({
		header: "Ações",
		id: "actions",
		cell: ({ row }) => {
			const onSeeContract = row.original.onSeeContract;
			const canSign = row.original.canSign;

			return (
				<div className="flex gap-2 text-gray-500">
					<Dropdown
						className="p-0.5 text-black"
						trigger={
							<TableIconButton>
								<Ellipsis size={16} />
							</TableIconButton>
						}
					>
						<MoreOptionsDropdownItem
							onClick={() => {
								onSeeContract(row.original.event.id);
							}}
						>
							<Eye color="gray" size={16} />
							<p>Detalhes {canSign ? "do Contrato" : "da Proposta"} </p>
						</MoreOptionsDropdownItem>
					</Dropdown>
				</div>
			);
		},
	}),
];

const columnHelperSale = createColumnHelper<EventsTableSaleRow>();
const columnsSale = [
	columnHelperSale.accessor("event", {
		header: "Evento",
		cell: (info) => {
			const event = info.getValue<EventsTableSaleRow["event"]>();
			return (
				<div className="flex flex-col">
					<div className="font-medium text-gray-900">{event.title}</div>
					<div className="text-gray-500">{formatDate(event.date)}</div>
				</div>
			);
		},
	}),
	columnHelperSale.accessor("statusComponent", {
		header: "status",
		cell: (info) => {
			const StatusComponent = info.getValue();
			return StatusComponent;
		},
	}),
	columnHelperSale.accessor("clientName", {
		header: "Cliente",
	}),
	columnHelperSale.accessor("value", {
		header: "Valor",
		cell: (info) => `R$ ${info.getValue()}`,
	}),
	columnHelperSale.display({
		id: "quickActions",
		cell: ({ row }) => {
			const canSign = row.original.canSign;
			const onSign = row.original.onSign;
			return (
				<div className="min-w-[100px]">
					<QuickActionIconButton
						onClick={() => {
							onSign(row.original.event.id);
						}}
					>
						<ScanEye size={16} className="mr-1" />
						<p>Visualizar {canSign ? "Contrato" : "Proposta"}</p>
					</QuickActionIconButton>
				</div>
			);
		},
	}),
	columnHelperSale.display({
		header: "Ações",
		id: "actions",
		cell: ({ row }) => {
			const isEditable = true;
			const onSeeContract = row.original.onSeeContract;
			const onEditContract = row.original.onEditContract;
			const canSign = row.original.canSign;

			return (
				<div className="flex gap-2 text-gray-500">
					<Dropdown
						className="p-0.5 text-black"
						trigger={
							<TableIconButton>
								<Ellipsis size={16} />
							</TableIconButton>
						}
					>
						{isEditable && (
							<MoreOptionsDropdownItem
								onClick={() => {
									onEditContract(row.original.event.id);
								}}
							>
								<Pen color="gray" size={16} />
								<p>Editar</p>
							</MoreOptionsDropdownItem>
						)}
						<MoreOptionsDropdownItem
							onClick={() => {
								onSeeContract(row.original.event.id);
							}}
						>
							<Eye color="gray" size={16} />
							<p>Detalhes {canSign ? "do Contrato" : "da Proposta"} </p>
						</MoreOptionsDropdownItem>
					</Dropdown>
				</div>
			);
		},
	}),
];

export const EventsTable = ({
	dataProposals = [],
	dataSales = [],
	mode,
}: EventsTableProps) => {
	return (
		<>
			{mode === "sale" ? (
				<GenericTable<EventsTableSaleRow>
					columns={columnsSale}
					data={dataSales}
				/>
			) : (
				<GenericTable<EventsTableProposalRow>
					columns={columnsProposal}
					data={dataProposals}
				/>
			)}
		</>
	);
};

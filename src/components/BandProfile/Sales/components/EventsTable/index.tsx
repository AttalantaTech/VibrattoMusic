import { createColumnHelper } from "@tanstack/react-table";
import { Ellipsis, Eye, Pen, PenTool, X } from "lucide-react";
import type { EventsTableData, EventsTableRow } from "./types";
import { GenericTable } from "../../../../ui/Table/Table";
import { TableIconButton } from "./components/TableIconButton";
import { Dropdown } from "../../../../ui/Dropdown/Dropdown";
import { MoreOptionsDropdownItem } from "./components/MoreOptionsDropdownItem";
import { QuickActionIconButton } from "./components/QuickActionIconButton";
import { formatDate } from "../../../../../utils/validation";

interface EventsTableProps {
	data: EventsTableData;
	pageSize?: number;
}

const columnHelper = createColumnHelper<EventsTableRow>();
const columns = [
	columnHelper.accessor("event", {
		header: "Evento",
		cell: (info) => {
			const event = info.getValue<EventsTableRow["event"]>();
			return (
				<div className="flex flex-col">
					<div className="font-medium text-gray-900">{event.title}</div>
					<div className="text-gray-500">{formatDate(event.date)}</div>
				</div>
			);
		},
	}),
	columnHelper.accessor("paymentStatusComponent", {
		header: "Pagamento",
		cell: (info) => {
			const StatusComponent = info.getValue();
			return StatusComponent;
		},
	}),
	columnHelper.accessor("clientName", {
		header: "Cliente",
	}),
	columnHelper.accessor("productName", {
		header: "Artista/Banda",
	}),
	columnHelper.accessor("value", {
		header: "Valor",
		cell: (info) => `R$ ${info.getValue()}`,
	}),
	columnHelper.display({
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
							<p>Assinar Contrato</p>
						</QuickActionIconButton>
					)}
				</div>
			);
		},
	}),
	columnHelper.display({
		header: "Ações",
		id: "actions",
		cell: ({ row }) => {
			const isEditable = true;
			const isCancelable = true;
			const onSeeContract = row.original.onSeeContract;
			const onEditContract = row.original.onEditContract;
			const onReject = row.original.onReject;

			return (
				<div className="flex gap-2 text-gray-500">
					<TableIconButton
						onClick={() => {
							onEditContract(row.original.event.id);
						}}
					>
						<Pen size={16} />
					</TableIconButton>
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
							<p>Ver Contrato</p>
						</MoreOptionsDropdownItem>
						{isCancelable && (
							<MoreOptionsDropdownItem
							onClick={()=>{onReject(row.original.event.id)}}
							className="text-red-500">
								<X size={16} />
								<p>Cancelar Proposta</p>
							</MoreOptionsDropdownItem>
						)}
					</Dropdown>
				</div>
			);
		},
	}),
];

export const EventsTable = ({ data }: EventsTableProps) => {
	return <GenericTable<EventsTableRow> columns={columns} data={data} />;
};

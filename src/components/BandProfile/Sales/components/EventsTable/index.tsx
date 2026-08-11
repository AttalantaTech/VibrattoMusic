import { createColumnHelper } from "@tanstack/react-table";
import { Eye, File, Pen, SquarePen } from "lucide-react";
import type {
	EventsTableHiresData,
	EventsTableHiresRow,
	EventsTableSaleData,
	EventsTableSaleRow,
} from "./types";
import { GenericTable } from "../../../../ui/Table/Table";
import { Dropdown } from "../../../../ui/Dropdown/Dropdown";
import { MoreOptionsDropdownItem } from "./components/MoreOptionsDropdownItem";
import { formatDate } from "../../../../../utils/validation";
import { Button } from "@/components/ui/Button/Button";
import { handleCurrencyFormatting } from "@/utils";

interface EventsTableProps {
	dataSales?: EventsTableSaleData;
	dataProposals?: EventsTableHiresData;
	pageSize?: number;
	mode?: "hires" | "sale";
}

const columnHelperHires = createColumnHelper<EventsTableHiresRow>();

const columnsHires = [
	columnHelperHires.accessor("event", {
		header: "Evento",
		cell: (info) => {
			const event = info.getValue<EventsTableHiresRow["event"]>();
			return (
				<div className="flex flex-col">
					<div className="font-medium text-gray-900">{event.title}</div>
					<div className="text-gray-500">{formatDate(event.date)}</div>
				</div>
			);
		},
	}),
	columnHelperHires.accessor("statusComponent", {
		header: "Status",
		cell: (info) => {
			const StatusComponent = info.getValue();
			return StatusComponent;
		},
	}),
	columnHelperHires.accessor("productName", {
		header: "Artista/Banda",
	}),
	columnHelperHires.accessor("value", {
		header: "Valor",
		cell: (info) => `R$ ${handleCurrencyFormatting(info.getValue())}`,
	}),
	columnHelperHires.display({
		header: "Ações",
		id: "actions",
		cell: ({ row }) => {
			const onSeeProposal = row.original.onSeeProposal;
			const onSeeContract = row.original.onSeeContract;
			const canSign = row.original.canSign;

			return (
				<div className="flex gap-2 text-gray-500">
					<Dropdown
						className="p-0.5 text-black"
						trigger={
							<Button size="sm" variant="secondary">
								Detalhes
							</Button>
						}
					>
						<MoreOptionsDropdownItem
							onClick={() => {
								onSeeProposal(row.original.event.id);
							}}
						>
							<Eye color="gray" size={16} />
							<p>Detalhes da Proposta </p>
						</MoreOptionsDropdownItem>

						{canSign && (
							<MoreOptionsDropdownItem
								onClick={() => {
									onSeeContract(row.original.event.id);
								}}
							>
								<File color="gray" size={16} />
								<p>Visualizar do Contrato </p>
							</MoreOptionsDropdownItem>
						)}
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
		cell: (info) => `R$ ${handleCurrencyFormatting(info.getValue())}`,
	}),
	columnHelperSale.display({
		id: "quickActions",
		cell: ({ row }) => {
			const acceptsCounterProposal = row.original.aceitaContraProposta;

			return (
				<div className="min-w-[100px]">
					{acceptsCounterProposal && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								row.original.onCounterProposal(row.original.event.id);
							}}
						>
							<SquarePen size={16} className="mr-1" />
							<p>Fazer Contraproposta</p>
						</Button>
					)}
				</div>
			);
		},
	}),
	columnHelperSale.display({
		header: "Ações",
		id: "actions",
		cell: ({ row }) => {
			const isEditable = true;
			const onSeeProposal = row.original.onSeeProposal;
			const onSeeContract = row.original.onSeeContract;
			const onEditContract = row.original.onEditContract;
			const canSign = row.original.canSign;

			return (
				<div className="flex gap-2 text-gray-500">
					<Dropdown
						className="p-0.5 text-black"
						trigger={
							<Button size="sm" variant="secondary">
								Detalhes
							</Button>
						}
					>
						{isEditable && row.original.status !== "Cancelada" && (
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
								onSeeProposal(row.original.event.id);
							}}
						>
							<Eye color="gray" size={16} />
							<p>Detalhes da Proposta </p>
						</MoreOptionsDropdownItem>

						{canSign && (
							<MoreOptionsDropdownItem
								onClick={() => {
									onSeeContract(row.original.event.id);
								}}
							>
								<File color="gray" size={16} />
								<p>Visualizar do Contrato </p>
							</MoreOptionsDropdownItem>
						)}
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
				<GenericTable<EventsTableHiresRow>
					columns={columnsHires}
					data={dataProposals}
				/>
			)}
		</>
	);
};

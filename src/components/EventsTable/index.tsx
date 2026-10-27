import { createColumnHelper } from "@tanstack/react-table";
import { Eye, File, Pen, Share, SquarePen } from "lucide-react";
import type {
	EventsTableBudgetsData,
	EventsTableBudgetsRow,
	EventsTableHiresData,
	EventsTableHiresRow,
	EventsTableSaleData,
	EventsTableSaleRow,
} from "./types";
import { GenericTable } from "../ui/Table/Table";
import { Dropdown } from "../ui/Dropdown/Dropdown";
import { MoreOptionsDropdownItem } from "../ui/MoreOptionsDropdownItem";
import { formatDate } from "../../utils/validation";
import { Button } from "@/components/ui/Button/Button";
import { handleCurrencyFormatting } from "@/utils";

interface EventsTableProps {
	dataSales?: EventsTableSaleData;
	dataProposals?: EventsTableHiresData;
	dataBudgets?: EventsTableBudgetsData;
	pageSize?: number;
	mode?: "hires" | "sale" | "budgets";
}

const columnHelperHires = createColumnHelper<EventsTableHiresRow>();
const columnsHires = [
	columnHelperHires.accessor("event", {
		header: "Evento",
		size: 300,
		cell: (info) => {
			const event = info.getValue<EventsTableSaleRow["event"]>();
			return (
				<div className="flex flex-col min-w-0 w-full">
					<div
						className="font-medium text-gray-900 truncate"
						title={event.title}
					>
						{event.title.substring(0, 50) +
							(event.title.length > 50 ? "..." : "")}
					</div>
					<div className="text-gray-500 truncate">{formatDate(event.date)}</div>
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
		cell: ({ row }) => row.original.productName || "-",
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

						<MoreOptionsDropdownItem
							onClick={() => {
								onSeeContract(row.original.event.id);
							}}
						>
							<File color="gray" size={16} />
							<p>Visualizar do Contrato </p>
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
		size: 300,
		cell: (info) => {
			const event = info.getValue<EventsTableSaleRow["event"]>();
			return (
				<div className="flex flex-col min-w-0 w-full">
					<div
						className="font-medium text-gray-900 truncate"
						title={event.title}
					>
						{event.title.substring(0, 50) +
							(event.title.length > 50 ? "..." : "")}
					</div>
					<div className="text-gray-500 truncate">{formatDate(event.date)}</div>
				</div>
			);
		},
	}),
	columnHelperSale.accessor("statusComponent", {
		header: "Status",
		minSize: 200,
		cell: (info) => {
			const StatusComponent = info.getValue();
			return <div className="flex justify-center">{StatusComponent}</div>;
		},
	}),
	columnHelperSale.accessor("clientName", {
		header: "Cliente",
		cell: ({ row }) => row.original.clientName,
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
				<div>
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
			const onShareProposal = row.original.onShareProposal;

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

						<MoreOptionsDropdownItem
							onClick={() => {
								onSeeContract(row.original.event.id);
							}}
						>
							<File color="gray" size={16} />
							<p>Visualizar do Contrato </p>
						</MoreOptionsDropdownItem>

						<MoreOptionsDropdownItem
							onClick={() => {
								onShareProposal(row.original.event.id);
							}}
						>
							<Share color="gray" size={16} />
							<p>Compartilhar Proposta</p>
						</MoreOptionsDropdownItem>
					</Dropdown>
				</div>
			);
		},
	}),
];

const columnHelperBudget = createColumnHelper<EventsTableBudgetsRow>();
const columnBudget = [
	columnHelperBudget.accessor("budget", {
		header: "Evento",
		cell: (info) => {
			const event = info.getValue<EventsTableBudgetsRow["budget"]>();
			return (
				<div className="flex flex-col">
					<div className="font-medium text-gray-900">{event.descricao}</div>
					<div className="text-gray-500">{formatDate(event.dataEvento)}</div>
				</div>
			);
		},
	}),
	columnHelperBudget.accessor("budget.contratante.nome", {
		header: "Cliente",
		cell: ({ row }) => row.original.budget.contratante.nome || "-",
	}),
	columnHelperBudget.display({
		header: "Ações",
		id: "actions",
		cell: ({ row }) => {
			return (
				<div className="min-w-[100px]">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							row.original.createProposal(row.original.budget);
						}}
					>
						<SquarePen size={16} className="mr-1" />
						<p>Criar Proposta</p>
					</Button>
				</div>
			);
		},
	}),
];

export const EventsTable = ({
	dataProposals = [],
	dataSales = [],
	dataBudgets = [],
	mode,
}: EventsTableProps) => {
	return (
		<>
			{mode === "sale" ? (
				<GenericTable<EventsTableSaleRow>
					columns={columnsSale}
					data={dataSales}
				/>
			) : mode === "budgets" ? (
				<GenericTable<EventsTableBudgetsRow>
					columns={columnBudget}
					data={dataBudgets}
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

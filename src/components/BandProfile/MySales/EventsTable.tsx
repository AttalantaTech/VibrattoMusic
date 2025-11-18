import { createColumnHelper } from "@tanstack/react-table";
import type { MyEvent } from "../../../common/types";
import { MessageCircleIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import { GenericTable } from "../../ui/Table/Table";

interface EventsTableProps {
	data: Array<MyEvent>;
	pageSize?: number;
}

const columnHelper = createColumnHelper<MyEvent>();
const columns = [
	columnHelper.accessor("title", {
		header: "Evento",
		cell: ({ row }) => (
			<div className="flex flex-col">
				<div className="font-medium text-gray-900">{row.getValue("title")}</div>
				<div className="text-gray-500">{row.getValue("date")}</div>
			</div>
		),
	}),
	columnHelper.accessor("status", {
		header: "Pagamento",
		cell: (info) => {
			const status = info.getValue();
			return (
				<span
					className={`px-2 py-1 rounded-full text-xs ${
						status === "Pago"
							? "bg-green-100 text-green-800"
							: "bg-gray-100 text-gray-700"
					}`}
				>
					{status}
				</span>
			);
		},
	}),
	columnHelper.accessor("client", {
		header: "Cliente",
	}),
	columnHelper.accessor("value", {
		header: "Valor",
		cell: (info) => `R$ ${info.getValue()}`,
	}),
	columnHelper.display({
		id: "actions",
		cell: () => (
			<div className="flex gap-5">
				<button>
					<SquareArrowOutUpRightIcon size={20} />
				</button>
				<button>
					<MessageCircleIcon size={20} />
				</button>
			</div>
		),
	}),
];

export const EventsTable = ({ data }: EventsTableProps) => {
	return <GenericTable<MyEvent> columns={columns} data={data} />;
};

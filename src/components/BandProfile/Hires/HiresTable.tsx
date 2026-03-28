import { createColumnHelper } from "@tanstack/react-table";
import type { MyHiring, HiringStatus } from "../../../common/types";
import {
	MessageCircleIcon,
	SquareArrowOutUpRightIcon,
	FileTextIcon,
	XIcon,
	EyeIcon,
} from "lucide-react";
import { GenericTable } from "../../ui/Table/Table";
import { Button } from "../../ui/Button/Button";

interface HiresTableProps {
	data: Array<MyHiring>;
	pageSize?: number;
	onViewContract?: (contractId: string) => void;
	onViewProposal?: (hiringId: string) => void;
	onCancelHiring?: (hiringId: string) => void;
	onViewDetails?: (hiringId: string) => void;
}

const getStatusColor = (status: HiringStatus) => {
	switch (status) {
		case "Proposta recebida":
			return "bg-primary-100 text-primary-800";
		case "Aguardando pagamento":
			return "bg-yellow-100 text-yellow-800";
		case "Contrato pendente":
			return "bg-orange-100 text-orange-800";
		case "Contrato assinado":
			return "bg-green-100 text-green-800";
		case "Cancelada":
			return "bg-red-100 text-red-800";
		default:
			return "bg-gray-100 text-gray-700";
	}
};

const columnHelper = createColumnHelper<MyHiring>();

export const HiresTable = ({
	data,
	pageSize,
	onViewContract,
	onViewProposal,
	onCancelHiring,
	onViewDetails,
}: HiresTableProps) => {
	// Create columns with handlers
	const tableColumns = [
		columnHelper.accessor("title", {
			header: "Evento/Serviço",
			cell: ({ row }) => (
				<div className="flex flex-col">
					<div className="font-medium text-gray-900">
						{row.getValue("title")}
					</div>
					<div className="text-gray-500 text-sm">{row.getValue("date")}</div>
				</div>
			),
		}),
		columnHelper.accessor("hiredArtist", {
			header: "Músico Contratado",
			cell: ({ row }) => (
				<div className="flex flex-col">
					<div className="font-medium text-gray-900">
						{row.getValue("hiredArtist")}
					</div>
					<div className="text-gray-500 text-sm">{row.original.service}</div>
				</div>
			),
		}),
		columnHelper.accessor("value", {
			header: "Valor",
			cell: (info) => (
				<span className="font-medium text-gray-900">R$ {info.getValue()}</span>
			),
		}),
		columnHelper.accessor("status", {
			header: "Status",
			cell: (info) => {
				const status = info.getValue();
				return (
					<span
						className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
					>
						{status}
					</span>
				);
			},
		}),
		columnHelper.display({
			id: "actions",
			header: "Ações",
			cell: ({ row }) => {
				const hiring = row.original;
				return (
					<div className="flex gap-2">
						<Button
							variant="transparent"
							size="sm"
							onClick={() => onViewProposal?.(hiring.id)}
							className="p-2 hover:bg-primary-50"
							title="Visualizar Proposta"
						>
							<EyeIcon size={16} className="text-primary-600" />
						</Button>

						{hiring.contractId && (
							<Button
								variant="transparent"
								size="sm"
								onClick={() => onViewContract?.(hiring.contractId!)}
								className="p-2 hover:bg-green-50"
								title="Visualizar Contrato"
							>
								<FileTextIcon size={16} className="text-green-600" />
							</Button>
						)}

						{hiring.canCancel && hiring.status === "Aguardando pagamento" && (
							<Button
								variant="transparent"
								size="sm"
								onClick={() => onCancelHiring?.(hiring.id)}
								className="p-2 hover:bg-red-50"
								title="Cancelar Contratação"
							>
								<XIcon size={16} className="text-red-600" />
							</Button>
						)}

						<Button
							variant="transparent"
							size="sm"
							onClick={() => onViewDetails?.(hiring.id)}
							className="p-2 hover:bg-gray-50"
							title="Ver Detalhes"
						>
							<SquareArrowOutUpRightIcon size={16} className="text-gray-600" />
						</Button>

						<Button
							variant="transparent"
							size="sm"
							className="p-2 hover:bg-purple-50"
							title="Mensagens"
						>
							<MessageCircleIcon size={16} className="text-purple-600" />
						</Button>
					</div>
				);
			},
		}),
	];

	return (
		<GenericTable<MyHiring>
			columns={tableColumns}
			data={data}
			pageSize={pageSize}
		/>
	);
};

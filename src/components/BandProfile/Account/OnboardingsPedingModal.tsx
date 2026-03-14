import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { createColumnHelper } from "@tanstack/react-table";
import { GenericTable } from "../../ui/Table/Table";
import { Button } from "../../ui/Button/Button";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "@tanstack/react-router";
import { encryptValue } from "@/utils/encryptValue";
import { DialogDescription } from "@radix-ui/react-dialog";
import type { OnboardingApiResponse } from "@/api/types";

interface OnboardingsPedingTableProps {
	data: Array<OnboardingApiResponse>;
	pageSize?: number;
}

interface OnboardingsPedingModalProps {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	onboardingsPedingTable: OnboardingsPedingTableProps;
}

const getStatusColor = (status: "Pendente" | "Concluído") => {
	switch (status) {
		case "Concluído":
			return "bg-blue-100 text-blue-800";
		default:
			return "bg-yellow-100 text-yellow-800";
	}
};

const columnHelper = createColumnHelper<OnboardingApiResponse>();

export const OnboardingsPedingModal = ({
	isOpen,
	setIsOpen,
	onboardingsPedingTable: { data, pageSize },
}: OnboardingsPedingModalProps) => {
	const navigate = useNavigate();

	// Create columns with handlers
	const tableColumns = [
		columnHelper.accessor("nome", {
			maxSize: 1,
			header: "Nome",
			cell: ({ row }) => {
				return (
					<div className="flex flex-col">
						{row.original.nome ? (
							<div className="font-medium text-gray-900">
								{row.original.nome}
							</div>
						) : (
							<div className="font-light italic text-gray-600">
								Desconhecido
							</div>
						)}
					</div>
				);
			},
		}),
		columnHelper.accessor("id", {
			maxSize: 1,
			header: "Status",
			cell: (info) => {
				const status = info.getValue() === 6 ? "Concluído" : "Pendente";

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
			maxSize: 1,
			header: "Ações",
			cell: ({ row }) => {
				return (
					<div className="flex gap-2">
						<Button
							variant="primary"
							size="sm"
							onClick={async () => {
								const etapaCadastro =
									row.original.etapaCadastro === 6
										? row.original.etapaCadastro
										: row.original.etapaCadastro + 1;

								await navigate({
									to: `/band/register/onboarding/${etapaCadastro}`,
									search: {
										registerId: encryptValue(row.original.id.toString()),
									},
								});
							}}
							title="Concluir Perfil"
						>
							Concluir Perfil
						</Button>
					</div>
				);
			},
		}),
	];

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-xl">
				<DialogHeader>
					<DialogTitle title="Cadastros Pendetes">
						Cadastros Pendentes
					</DialogTitle>

					<DialogDescription />
				</DialogHeader>

				<div className="overflow-auto">
					<GenericTable<OnboardingApiResponse>
						columns={tableColumns}
						data={data}
						pageSize={pageSize}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

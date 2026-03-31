import {
	Dialog,
	DialogContent,
	DialogFooter,
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDisableOnboarding } from "@/hooks/useMusicalProducts";
import { LoadingSpinner } from "@/components/ui/LoadingStates";

interface OnboardingsPedingTableProps {
	data: Array<OnboardingApiResponse>;
	pageSize?: number;
}

interface OnboardingsPedingModalProps {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	onboardingsPedingTable: OnboardingsPedingTableProps;
	clickComeFrom?: "profile" | "header-menu";
}

const getStatusColor = (status: "Pendente" | "Concluído") => {
	switch (status) {
		case "Concluído":
			return "bg-primary-100 text-primary-800";
		default:
			return "bg-yellow-100 text-yellow-800";
	}
};

const columnHelper = createColumnHelper<OnboardingApiResponse>();

export const OnboardingsPedingModal = ({
	isOpen,
	setIsOpen,
	onboardingsPedingTable: { data, pageSize },
	clickComeFrom,
}: OnboardingsPedingModalProps) => {
	const navigate = useNavigate();
	const disableOnboardingMutation = useDisableOnboarding();

	const handleDisableOnboarding = async (onboardingId: number) => {
		await disableOnboardingMutation
			.mutateAsync({ onboardingId })
			.then(() => {
				toast.info(
					"O perfil foi deletado e agora você não possui mais nenhum pendente!"
				);
			})
			.catch(() => {
				toast.error("Ocorreu um erro. Tente novamente mais tarde!");
			});
	};

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
							variant="outline"
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

						<Button
							variant="danger"
							size="sm"
							className="px-2 relative"
							disabled={disableOnboardingMutation.isPending}
							onClick={async () => {
								await handleDisableOnboarding(row.original.id);
							}}
						>
							{disableOnboardingMutation.isPending && (
								<div className="absolute">
									<LoadingSpinner size="sm" />
								</div>
							)}
							<Trash2 size={20} />
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
					{data.length > 0 ? (
						<DialogTitle title="Cadastros Pendetes">
							Cadastros Pendentes
						</DialogTitle>
					) : (
						<DialogTitle title="Cria Perfil Profissional">
							Cria Perfil Profissional
						</DialogTitle>
					)}

					<DialogDescription>
						{clickComeFrom === "header-menu" && (
							<>
								{data.length > 0 ? (
									<span className="block mt-4 text-justify text-sm sm:text-[16px] text-gray-600">
										Você tem um perfil profissional em andamento. Para criar um
										novo, finalize ou remova o anterior.
									</span>
								) : (
									<span className="block mt-4 text-justify text-sm sm:text-[16px] text-gray-600 mb-8">
										Tem certeza que deseja criar um perfil profissional ?
									</span>
								)}
							</>
						)}
					</DialogDescription>
				</DialogHeader>

				{data.length > 0 && (
					<div className="overflow-auto">
						<GenericTable<OnboardingApiResponse>
							columns={tableColumns}
							data={data}
							pageSize={pageSize}
						/>
					</div>
				)}

				<DialogFooter className="gap-2">
					<Button
						variant="secondary"
						onClick={() => {
							setIsOpen(false);
						}}
					>
						Cancelar
					</Button>

					{clickComeFrom === "header-menu" && (
						<Button
							variant="primary"
							disabled={data.length > 0}
							onClick={async () => {
								await navigate({
									to: `/band/register/onboarding/1`,
									search: {
										type: "new-onboarding",
									},
								});
							}}
						>
							Criar Perfil
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

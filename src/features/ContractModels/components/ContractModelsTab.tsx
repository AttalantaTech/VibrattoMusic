import { useState } from "react";
import { toast } from "sonner";
import {
	Eye,
	FileText,
	MoreVertical,
	Pencil,
	Plus,
	Star,
	Trash2,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/Dropdown/Dropdown";
import { MoreOptionsDropdownItem } from "@/components/ui/MoreOptionsDropdownItem";
import { Button } from "@/components/ui/Button/Button";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import type { ContractModel, ContractModelSummary } from "../types";
import {
	DEMO_BASE_MODEL,
	summariesOf,
	useDemoContractModels,
} from "../hooks/useDemoContractModels";
import { isNameTaken } from "../utils/modelRules";
import { ContractModelEditor } from "./ContractModelEditor";
import { ContractPreview } from "./ContractPreview";

/** "Criar modelo": the name of a new copy of Vibratto's contract */
const NameDialog = ({
	open,
	title,
	description,
	initialName,
	others,
	onClose,
	onConfirm,
}: {
	open: boolean;
	title: string;
	description: string;
	initialName: string;
	others: Array<ContractModelSummary>;
	onClose: () => void;
	onConfirm: (name: string) => void;
}) => {
	const [name, setName] = useState(initialName);
	const taken = isNameTaken(name, others);
	const isValid = !!name.trim() && !taken;

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
				else setName(initialName);
			}}
		>
			<DialogContent className="w-full sm:max-w-md">
				<form
					onSubmit={(event) => {
						event.preventDefault();
						if (isValid) onConfirm(name.trim());
					}}
				>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{description}</DialogDescription>
					</DialogHeader>
					<div className="my-4 flex flex-col gap-1">
						<label
							htmlFor="new-model-name"
							className="text-sm font-medium text-gray-700"
						>
							Nome do modelo
						</label>
						<input
							id="new-model-name"
							autoFocus
							maxLength={80}
							placeholder="Ex.: Casamento, Formatura, Corporativo"
							className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
							value={name}
							onChange={(event) => {
								setName(event.target.value);
							}}
						/>
						{taken && (
							<p className="text-xs text-red-600">
								Você já tem um modelo com esse nome.
							</p>
						)}
					</div>
					<DialogFooter className="gap-2">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={onClose}
						>
							Cancelar
						</Button>
						<Button type="submit" size="sm" disabled={!isValid}>
							Criar e editar
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

/**
 * Vendas > Modelos de Contratos: the professional's own contracts, copied
 * from Vibratto's, one of them chosen by default in new proposals
 */
export const ContractModelsTab = () => {
	const { activeProduct } = useMusicalProductStore();
	const profileId = activeProduct?.id ?? 0;

	const models = useDemoContractModels((state) => state.byProfile[profileId]);
	const createModel = useDemoContractModels((state) => state.create);
	const updateModel = useDemoContractModels((state) => state.update);
	const setDefault = useDemoContractModels((state) => state.setDefault);
	const removeModel = useDemoContractModels((state) => state.remove);
	const summaries = summariesOf(models);

	const [editingId, setEditingId] = useState<number | null>(null);
	const [preview, setPreview] = useState<ContractModel | null>(null);
	const [isNaming, setIsNaming] = useState(false);
	const [deleting, setDeleting] = useState<ContractModelSummary | null>(null);

	const fullModel = (id: number): ContractModel | undefined =>
		models?.find((model) => model.id === id);
	const editing = editingId === null ? undefined : fullModel(editingId);

	if (!profileId) return null;

	if (editing)
		return (
			<div className="w-full pb-6">
				<ContractModelEditor
					key={editing.id}
					model={editing}
					onCancel={() => {
						setEditingId(null);
					}}
					onPreview={setPreview}
					onSave={(saved) => {
						updateModel(profileId, saved);
						toast.success("Modelo de contrato salvo");
						setEditingId(null);
					}}
				/>
				<ContractPreview
					model={preview}
					onClose={() => {
						setPreview(null);
					}}
				/>
			</div>
		);

	return (
		<div className="flex w-full flex-col gap-5 pb-10">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold text-gray-900">
						Modelos de contratos
					</h2>
					<p className="text-sm text-gray-600">
						Adapte o contrato para cada tipo de evento e escolha qual usar ao
						enviar a proposta.
					</p>
				</div>
				<Button
					size="sm"
					className="flex gap-2"
					onClick={() => {
						setIsNaming(true);
					}}
				>
					<Plus className="h-4 w-4" aria-hidden="true" />
					Criar modelo
				</Button>
			</div>

			<p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
				Versão de demonstração: os modelos ficam salvos só neste navegador e
				ainda não são usados nas propostas, até a ligação com o servidor.
			</p>

			<ul className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
				<li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-3">
						<FileText className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
						<div>
							<p className="font-medium text-gray-900">
								Contrato padrão da Vibratto
								{!summaries.some((model) => model.padrao) && (
									<span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
										Usado nas propostas
									</span>
								)}
							</p>
							<p className="text-sm text-gray-500">
								Usado quando você não escolhe outro modelo. Não pode ser
								alterado.
							</p>
						</div>
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							className="flex gap-1"
							onClick={() => {
								setPreview(DEMO_BASE_MODEL);
							}}
						>
							<Eye className="h-4 w-4" aria-hidden="true" />
							Ver
						</Button>
						{summaries.some((model) => model.padrao) && (
							<Button
								variant="transparent"
								size="sm"
								onClick={() => {
									setDefault(profileId, null);
									toast.success("O contrato da Vibratto voltou a ser o padrão");
								}}
							>
								Usar como padrão
							</Button>
						)}
					</div>
				</li>

				{summaries.map((summary) => (
					<li
						key={summary.id}
						className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
					>
						<div className="flex items-start gap-3">
							{summary.padrao ? (
								<Star
									className="mt-0.5 h-5 w-5 shrink-0 fill-amber-400 text-amber-400"
									aria-label="Modelo padrão"
								/>
							) : (
								<FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
							)}
							<div>
								<p className="font-medium text-gray-900">
									{summary.nome}
									{summary.padrao && (
										<span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
											Padrão nas propostas
										</span>
									)}
								</p>
								<p className="text-sm text-gray-500">Seu modelo</p>
							</div>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								className="flex gap-1"
								onClick={() => {
									setPreview(fullModel(summary.id) ?? null);
								}}
							>
								<Eye className="h-4 w-4" aria-hidden="true" />
								Ver
							</Button>
							<Button
								size="sm"
								className="flex gap-1"
								onClick={() => {
									setEditingId(summary.id);
								}}
							>
								<Pencil className="h-4 w-4" aria-hidden="true" />
								Editar
							</Button>
							<Dropdown
								className="p-1 text-sm"
								trigger={
									<button
										type="button"
										aria-label={`Mais ações de ${summary.nome}`}
										className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
									>
										<MoreVertical className="h-4 w-4" />
									</button>
								}
							>
								{!summary.padrao && (
									<MoreOptionsDropdownItem
										onClick={() => {
											setDefault(profileId, summary.id);
											toast.success(`"${summary.nome}" agora é o padrão`);
										}}
									>
										<Star className="h-4 w-4" /> Usar como padrão
									</MoreOptionsDropdownItem>
								)}
								<MoreOptionsDropdownItem
									className="text-red-600"
									onClick={() => {
										setDeleting(summary);
									}}
								>
									<Trash2 className="h-4 w-4" /> Excluir
								</MoreOptionsDropdownItem>
							</Dropdown>
						</div>
					</li>
				))}
			</ul>

			{summaries.length === 0 && (
				<p className="text-center text-sm text-gray-500">
					Você ainda não tem modelos próprios: as propostas usam o contrato
					padrão da Vibratto. Crie um para adaptar as cláusulas.
				</p>
			)}

			<NameDialog
				open={isNaming}
				title="Criar modelo"
				description="O modelo começa com as cláusulas do contrato padrão da Vibratto. Depois você adapta o que quiser."
				initialName=""
				others={summaries}
				onClose={() => {
					setIsNaming(false);
				}}
				onConfirm={(name) => {
					const id = createModel(profileId, name);
					setIsNaming(false);
					setEditingId(id);
				}}
			/>

			<Dialog
				open={!!deleting}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
			>
				<DialogContent className="w-full sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Excluir "{deleting?.nome}"?</DialogTitle>
						<DialogDescription>
							Propostas já enviadas com este modelo não mudam. As próximas
							passam a usar{" "}
							{deleting?.padrao
								? "o contrato padrão da Vibratto"
								: "o modelo padrão"}
							.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								setDeleting(null);
							}}
						>
							Cancelar
						</Button>
						<Button
							variant="danger"
							size="sm"
							onClick={() => {
								if (deleting) {
									removeModel(profileId, deleting.id);
									toast.success("Modelo excluído");
								}
								setDeleting(null);
							}}
						>
							Excluir
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ContractPreview
				model={preview}
				onClose={() => {
					setPreview(null);
				}}
			/>
		</div>
	);
};

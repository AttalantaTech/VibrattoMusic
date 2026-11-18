import { useEffect, useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button/Button";
import { GROUPS, type TemplateItem } from "../types";
import { DEFAULT_TEMPLATE } from "../utils/defaultTemplate";
import { newItemId } from "../hooks/useChecklistStore";

interface TemplateEditorProps {
	isOpen: boolean;
	template: Array<TemplateItem>;
	onClose: () => void;
	onSave: (template: Array<TemplateItem>) => void;
}

const EDITABLE_GROUPS = GROUPS.filter(
	(group): group is (typeof GROUPS)[number] & { id: TemplateItem["group"] } =>
		group.id !== "negocio"
);

/**
 * "Meu modelo de checklist": the items that go to every event. The business
 * items aren't here: the system checks them by itself
 */
export const TemplateEditor = ({
	isOpen,
	template,
	onClose,
	onSave,
}: TemplateEditorProps) => {
	const [draft, setDraft] = useState(template);
	const [newLabels, setNewLabels] = useState<Record<string, string>>({});

	useEffect(() => {
		if (isOpen) {
			setDraft(template);
			setNewLabels({});
		}
	}, [isOpen, template]);

	const add = (group: TemplateItem["group"]) => {
		const label = newLabels[group]?.trim();
		if (!label) return;
		setDraft((items) => [...items, { id: newItemId(), label, group }]);
		setNewLabels((labels) => ({ ...labels, [group]: "" }));
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				className="max-h-[90vh] w-full overflow-y-auto sm:max-w-lg"
				// Not on the first item: a key pressed by mistake would erase it
				onOpenAutoFocus={(event) => {
					event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Meu modelo de checklist</DialogTitle>
					<DialogDescription>
						Estes itens entram em todo evento. Em cada evento você ainda pode
						tirar ou incluir itens só para ele.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-5">
					{EDITABLE_GROUPS.map((group) => (
						<section key={group.id}>
							<h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
								{group.label}
							</h4>
							<ul className="flex flex-col">
								{draft
									.filter((item) => item.group === group.id)
									.map((item) => (
										<li
											key={item.id}
											className="flex items-center gap-2 border-b border-gray-100 py-1.5"
										>
											<input
												aria-label="Nome do item"
												className="flex-1 rounded px-1 py-0.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500"
												value={item.label}
												maxLength={120}
												onChange={(event) => {
													const label = event.target.value;
													setDraft((items) =>
														items.map((current) =>
															current.id === item.id
																? { ...current, label }
																: current
														)
													);
												}}
											/>
											<button
												type="button"
												aria-label={`Tirar "${item.label}" do modelo`}
												className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
												onClick={() => {
													setDraft((items) =>
														items.filter((current) => current.id !== item.id)
													);
												}}
											>
												<X className="h-4 w-4" />
											</button>
										</li>
									))}
							</ul>
							<form
								className="mt-2 flex gap-2"
								onSubmit={(event) => {
									event.preventDefault();
									add(group.id);
								}}
							>
								<input
									aria-label={`Novo item em ${group.label}`}
									className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									placeholder="Novo item"
									maxLength={120}
									value={newLabels[group.id] ?? ""}
									onChange={(event) => {
										setNewLabels((labels) => ({
											...labels,
											[group.id]: event.target.value,
										}));
									}}
								/>
								<Button
									type="submit"
									size="sm"
									variant="outline"
									aria-label={`Adicionar em ${group.label}`}
								>
									<Plus className="h-4 w-4" />
								</Button>
							</form>
						</section>
					))}
				</div>

				<DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
					<Button
						type="button"
						variant="transparent"
						size="sm"
						className="flex gap-1"
						onClick={() => {
							setDraft(DEFAULT_TEMPLATE);
						}}
					>
						<RotateCcw className="h-4 w-4" aria-hidden="true" />
						Voltar ao sugerido
					</Button>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={onClose}
						>
							Cancelar
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={() => {
								onSave(
									draft
										.map((item) => ({ ...item, label: item.label.trim() }))
										.filter((item) => item.label)
								);
								onClose();
							}}
						>
							Salvar modelo
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

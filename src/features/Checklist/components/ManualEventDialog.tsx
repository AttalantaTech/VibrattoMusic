import { useEffect, useState, type FormEvent } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button/Button";
import type { ManualEvent } from "../types";
import { newItemId } from "../hooks/useChecklistStore";

interface ManualEventDialogProps {
	isOpen: boolean;
	/** The checklist being edited; absent when creating one */
	event?: ManualEvent;
	onClose: () => void;
	onSave: (event: ManualEvent) => void;
}

const empty = (): ManualEvent => ({
	id: newItemId(),
	title: "",
	date: "",
	startTime: "",
	client: "",
	place: "",
});

const fieldClass =
	"w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

/**
 * "Criar checklist avulso": like a standalone proposal, for an event that
 * isn't a Vibratto proposal nor saved in the agenda
 */
export const ManualEventDialog = ({
	isOpen,
	event,
	onClose,
	onSave,
}: ManualEventDialogProps) => {
	const [draft, setDraft] = useState<ManualEvent>(event ?? empty());
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen) {
			setDraft(event ?? empty());
			setError(null);
		}
	}, [isOpen, event]);

	const set = (field: keyof ManualEvent, value: string) => {
		setDraft((current) => ({ ...current, [field]: value }));
		setError(null);
	};

	const submit = (formEvent: FormEvent) => {
		formEvent.preventDefault();
		if (!draft.title.trim()) {
			setError("Dê um nome ao evento.");
			return;
		}
		if (!draft.date) {
			setError("Informe a data do evento.");
			return;
		}
		onSave({ ...draft, title: draft.title.trim() });
		onClose();
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="w-full sm:max-w-md">
				<form noValidate onSubmit={submit}>
					<DialogHeader>
						<DialogTitle>
							{event ? "Editar checklist avulso" : "Criar checklist avulso"}
						</DialogTitle>
						<DialogDescription>
							Para um evento que não veio de uma proposta da Vibratto. O
							checklist começa com o seu modelo.
						</DialogDescription>
					</DialogHeader>

					<div className="my-4 flex flex-col gap-3">
						<div className="flex flex-col gap-1">
							<label
								htmlFor="manual-title"
								className="text-sm font-medium text-gray-700"
							>
								Nome do evento <span className="text-red-500">*</span>
							</label>
							<input
								id="manual-title"
								autoFocus
								maxLength={100}
								placeholder="Ex.: Casamento Ana e João"
								className={fieldClass}
								value={draft.title}
								onChange={(input) => {
									set("title", input.target.value);
								}}
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="flex flex-col gap-1">
								<label
									htmlFor="manual-date"
									className="text-sm font-medium text-gray-700"
								>
									Data <span className="text-red-500">*</span>
								</label>
								<input
									id="manual-date"
									type="date"
									className={fieldClass}
									value={draft.date}
									onChange={(input) => {
										set("date", input.target.value);
									}}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label
									htmlFor="manual-time"
									className="text-sm font-medium text-gray-700"
								>
									Horário{" "}
									<span className="font-normal text-gray-400">(opcional)</span>
								</label>
								<input
									id="manual-time"
									type="time"
									className={fieldClass}
									value={draft.startTime}
									onChange={(input) => {
										set("startTime", input.target.value);
									}}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1">
							<label
								htmlFor="manual-client"
								className="text-sm font-medium text-gray-700"
							>
								Contratante{" "}
								<span className="font-normal text-gray-400">(opcional)</span>
							</label>
							<input
								id="manual-client"
								maxLength={100}
								placeholder="Quem vai receber o checklist"
								className={fieldClass}
								value={draft.client}
								onChange={(input) => {
									set("client", input.target.value);
								}}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<label
								htmlFor="manual-place"
								className="text-sm font-medium text-gray-700"
							>
								Local{" "}
								<span className="font-normal text-gray-400">(opcional)</span>
							</label>
							<input
								id="manual-place"
								maxLength={150}
								placeholder="Ex.: Espaço Jardim Europa, Campinas - SP"
								className={fieldClass}
								value={draft.place}
								onChange={(input) => {
									set("place", input.target.value);
								}}
							/>
						</div>

						{error && (
							<p className="text-sm text-red-600" role="alert">
								{error}
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
						<Button type="submit" size="sm">
							{event ? "Salvar" : "Criar checklist"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

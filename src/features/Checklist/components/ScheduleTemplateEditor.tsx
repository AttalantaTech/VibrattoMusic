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
import type { ScheduleStep } from "../types";
import { DEFAULT_SCHEDULE, describeOffset } from "../utils/schedule";
import { newItemId } from "../hooks/useChecklistStore";

interface ScheduleTemplateEditorProps {
	isOpen: boolean;
	steps: Array<ScheduleStep>;
	onClose: () => void;
	onSave: (steps: Array<ScheduleStep>) => void;
}

const selectClass =
	"rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

/**
 * "Cronograma padrão": each step in relation to the show, so every event
 * gets its times by itself ("Passagem de som: 45 min antes do início")
 */
export const ScheduleTemplateEditor = ({
	isOpen,
	steps,
	onClose,
	onSave,
}: ScheduleTemplateEditorProps) => {
	const [draft, setDraft] = useState(steps);

	useEffect(() => {
		if (isOpen) setDraft(steps);
	}, [isOpen, steps]);

	const update = (id: string, change: Partial<ScheduleStep>) => {
		setDraft((items) =>
			items.map((item) => (item.id === id ? { ...item, ...change } : item))
		);
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				className="max-h-[90vh] w-full overflow-y-auto sm:max-w-2xl"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Cronograma padrão</DialogTitle>
					<DialogDescription>
						Os horários de cada evento são calculados pelo início e término do
						show. Em cada evento você ainda pode ajustar.
					</DialogDescription>
				</DialogHeader>

				<ul className="flex flex-col divide-y divide-gray-100">
					{draft.map((step) => {
						const minutes = Math.abs(step.offset);
						return (
							<li key={step.id} className="flex flex-col gap-2 py-3">
								<div className="flex items-center gap-2">
									<input
										aria-label="Etapa"
										className={`${selectClass} min-w-0 flex-1 font-medium`}
										value={step.label}
										maxLength={100}
										onChange={(input) => {
											update(step.id, { label: input.target.value });
										}}
									/>
									<button
										type="button"
										aria-label={`Tirar "${step.label}"`}
										className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
										onClick={() => {
											setDraft((items) =>
												items.filter((item) => item.id !== step.id)
											);
										}}
									>
										<X className="h-4 w-4" />
									</button>
								</div>
								<div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
									<select
										aria-label="Quanto tempo"
										className={selectClass}
										value={minutes}
										onChange={(input) => {
											const amount = Number(input.target.value);
											const sign = step.offset > 0 ? 1 : -1;
											update(step.id, { offset: amount * sign });
										}}
									>
										{[0, 10, 15, 20, 30, 45, 60, 90, 120, 150, 180, 240].map(
											(value) => (
												<option key={value} value={value}>
													{value === 0
														? "No momento"
														: value >= 60
															? `${Math.floor(value / 60)}h${value % 60 ? value % 60 : ""}`
															: `${value} min`}
												</option>
											)
										)}
									</select>
									{minutes > 0 && (
										<select
											aria-label="Antes ou depois"
											className={selectClass}
											value={step.offset < 0 ? "antes" : "depois"}
											onChange={(input) => {
												update(step.id, {
													offset:
														input.target.value === "antes" ? -minutes : minutes,
												});
											}}
										>
											<option value="antes">antes</option>
											<option value="depois">depois</option>
										</select>
									)}
									<span>do</span>
									<select
										aria-label="Início ou término do show"
										className={selectClass}
										value={step.anchor}
										onChange={(input) => {
											update(step.id, {
												anchor: input.target.value as ScheduleStep["anchor"],
											});
										}}
									>
										<option value="inicio">início do show</option>
										<option value="fim">término do show</option>
									</select>
									<span className="text-xs text-gray-400">
										({describeOffset(step)})
									</span>
								</div>
							</li>
						);
					})}
				</ul>

				<button
					type="button"
					className="inline-flex items-center gap-1 self-start text-sm text-primary-600 hover:text-primary-500"
					onClick={() => {
						setDraft((items) => [
							...items,
							{
								id: newItemId(),
								label: "Nova etapa",
								anchor: "inicio",
								offset: -30,
							},
						]);
					}}
				>
					<Plus className="h-4 w-4" aria-hidden="true" />
					Adicionar etapa
				</button>

				<DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
					<Button
						type="button"
						variant="transparent"
						size="sm"
						className="flex gap-1"
						onClick={() => {
							setDraft(DEFAULT_SCHEDULE);
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
								onSave(draft.filter((step) => step.label.trim()));
								onClose();
							}}
						>
							Salvar cronograma
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

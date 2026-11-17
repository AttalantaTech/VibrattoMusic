import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
	CheckCircle2,
	Circle,
	Lock,
	MapPin,
	Plus,
	Share2,
	X,
} from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import {
	GROUPS,
	type ChecklistEvent,
	type ChecklistItem,
	type TemplateItem,
} from "../types";
import { progressOf } from "../utils/buildChecklist";
import { newItemId } from "../hooks/useChecklistStore";
import { ProgressBar } from "./ProgressBar";

interface EventChecklistProps {
	event: ChecklistEvent;
	items: Array<ChecklistItem>;
	onToggle: (itemId: string) => void;
	onAdd: (item: TemplateItem) => void;
	onRemove: (item: ChecklistItem) => void;
	onShare: () => void;
}

const AddItem = ({
	group,
	onAdd,
}: {
	group: TemplateItem["group"];
	onAdd: (item: TemplateItem) => void;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [label, setLabel] = useState("");

	const save = () => {
		const text = label.trim();
		if (text) onAdd({ id: newItemId(), label: text, group });
		setLabel("");
		setIsOpen(false);
	};

	if (!isOpen)
		return (
			<button
				type="button"
				className="mt-1 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-500"
				onClick={() => {
					setIsOpen(true);
				}}
			>
				<Plus className="h-4 w-4" aria-hidden="true" />
				Adicionar item
			</button>
		);

	return (
		<form
			className="mt-1 flex gap-2"
			onSubmit={(event) => {
				event.preventDefault();
				save();
			}}
		>
			<input
				autoFocus
				aria-label="Novo item"
				className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				placeholder="Ex.: Levar banner da banda"
				value={label}
				maxLength={120}
				onChange={(event) => {
					setLabel(event.target.value);
				}}
				onKeyDown={(event) => {
					if (event.key === "Escape") setIsOpen(false);
				}}
			/>
			<Button type="submit" size="sm">
				Adicionar
			</Button>
		</form>
	);
};

/** One event's checklist, by group */
export const EventChecklist = ({
	event,
	items,
	onToggle,
	onAdd,
	onRemove,
	onShare,
}: EventChecklistProps) => {
	const { done, total } = progressOf(items);
	const when = format(parseISO(event.date), "EEEE, dd 'de' MMMM 'de' yyyy", {
		locale: ptBR,
	});

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-lg font-semibold text-gray-900">
							{event.title}
						</h3>
						<span
							className={`rounded-full px-2 py-0.5 text-xs font-medium ${
								event.origin === "vibratto"
									? "bg-primary-100 text-primary-800"
									: "bg-gray-100 text-gray-700"
							}`}
						>
							{event.origin === "vibratto"
								? "Contratado pela Vibratto"
								: "Fora da plataforma"}
						</span>
					</div>
					<p className="mt-1 text-sm text-gray-600 first-letter:uppercase">
						{when}
						{event.startTime ? ` às ${event.startTime.slice(0, 5)}` : ""}
					</p>
					{event.place && (
						<p className="mt-0.5 flex items-center gap-1 text-sm text-gray-600">
							<MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
							{event.place}
						</p>
					)}
				</div>

				<Button
					variant="outline"
					size="sm"
					className="flex shrink-0 gap-2"
					onClick={onShare}
				>
					<Share2 className="h-4 w-4" aria-hidden="true" />
					Compartilhar
				</Button>
			</div>

			<div>
				<div className="mb-1 flex justify-between text-sm text-gray-600">
					<span>Progresso</span>
					<span className="font-medium">
						{done} de {total}
					</span>
				</div>
				<ProgressBar done={done} total={total} />
			</div>

			{GROUPS.map((group) => {
				const groupItems = items.filter((item) => item.group === group.id);
				if (group.id === "negocio" && groupItems.length === 0) return null;

				return (
					<section key={group.id} className="flex flex-col gap-1">
						<h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
							{group.label}
						</h4>
						{group.hint && (
							<p className="mb-1 text-xs text-gray-500">{group.hint}</p>
						)}

						<ul className="flex flex-col">
							{groupItems.map((item) => (
								<li
									key={item.id}
									className="group flex items-start gap-3 rounded-md px-2 py-2 hover:bg-gray-50"
								>
									{item.auto ? (
										<span className="mt-0.5" title="Marcado automaticamente">
											{item.done ? (
												<CheckCircle2 className="h-5 w-5 text-green-600" />
											) : (
												<Circle className="h-5 w-5 text-gray-300" />
											)}
										</span>
									) : (
										<input
											type="checkbox"
											id={`check-${item.id}`}
											className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-primary-600"
											checked={item.done}
											onChange={() => {
												onToggle(item.id);
											}}
										/>
									)}

									<div className="min-w-0 flex-1">
										{item.auto ? (
											<span
												className={`text-sm ${item.done ? "text-gray-900" : "text-gray-700"}`}
											>
												{item.label}
											</span>
										) : (
											<label
												htmlFor={`check-${item.id}`}
												className={`cursor-pointer text-sm ${
													item.done
														? "text-gray-400 line-through"
														: "text-gray-900"
												}`}
											>
												{item.label}
											</label>
										)}
										{item.auto && item.detail && (
											<p className="flex items-center gap-1 text-xs text-gray-500">
												<Lock className="h-3 w-3" aria-hidden="true" />
												{item.detail}
											</p>
										)}
									</div>

									{!item.auto && (
										<button
											type="button"
											aria-label={`Tirar "${item.label}" deste evento`}
											title="Tirar deste evento"
											className="rounded p-1 text-gray-400 opacity-100 hover:bg-gray-200 hover:text-gray-700 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
											onClick={() => {
												onRemove(item);
											}}
										>
											<X className="h-4 w-4" />
										</button>
									)}
								</li>
							))}
						</ul>

						{group.id !== "negocio" && (
							<AddItem group={group.id} onAdd={onAdd} />
						)}
					</section>
				);
			})}
		</div>
	);
};

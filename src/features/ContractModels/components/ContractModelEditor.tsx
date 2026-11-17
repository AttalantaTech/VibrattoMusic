import { useMemo, useRef, useState } from "react";
import {
	AlertTriangle,
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	Eye,
	Lock,
	Plus,
	RotateCcw,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import type { ContractModel, ContractModelSection } from "../types";
import {
	MARKERS,
	labelOf,
	removedMarkers,
	splitMarkers,
	toApiText,
	toScreenText,
	unknownMarkers,
} from "../utils/markers";
import {
	changedSections,
	isModelChanged,
	mergeEditable,
	modelErrors,
} from "../utils/modelRules";
import {
	addClause,
	isNewClause,
	movableRange,
	moveClause,
	removeClause,
} from "../utils/clauseOrder";

interface ContractModelEditorProps {
	model: ContractModel;
	/** Original text of each section, to undo a clause */
	onSave: (model: ContractModel) => void;
	onCancel: () => void;
	onPreview: (model: ContractModel) => void;
}

/** A fixed section's text, with the automatic data shown as chips */
const TextWithMarkers = ({ text }: { text: string }) => (
	<p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
		{splitMarkers(toScreenText(text)).map((part, index) =>
			part.kind === "marker" ? (
				<span
					key={index}
					className="mx-0.5 inline-block rounded bg-primary-100 px-1.5 py-0.5 text-xs font-medium text-primary-800"
					title={part.value}
				>
					{labelOf(part.value)}
				</span>
			) : (
				<span key={index}>{part.value}</span>
			)
		)}
	</p>
);

const EditableSection = ({
	section,
	original,
	onChange,
}: {
	section: ContractModelSection;
	original: ContractModelSection | undefined;
	onChange: (text: string, title?: string) => void;
}) => {
	const textRef = useRef<HTMLTextAreaElement>(null);
	const [isPicking, setIsPicking] = useState(false);
	const text = toScreenText(section.texto);
	const removed = original ? removedMarkers(original.texto, section.texto) : [];
	const unknown = unknownMarkers(section.texto);
	const isChanged =
		!!original &&
		(original.texto !== section.texto || original.titulo !== section.titulo);

	const insert = (marker: string) => {
		const area = textRef.current;
		const start = area?.selectionStart ?? text.length;
		const end = area?.selectionEnd ?? text.length;
		const next = `${text.slice(0, start)}${marker}${text.slice(end)}`;
		onChange(toApiText(next));
		setIsPicking(false);
		requestAnimationFrame(() => {
			area?.focus();
			area?.setSelectionRange(start + marker.length, start + marker.length);
		});
	};

	return (
		<div className="flex flex-col gap-2">
			<textarea
				ref={textRef}
				aria-label={`Texto da ${section.titulo}`}
				className="min-h-[120px] w-full resize-y rounded-md border border-gray-300 p-3 text-sm leading-relaxed text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				value={text}
				rows={Math.min(14, Math.max(4, text.split("\n").length + 2))}
				onChange={(event) => {
					onChange(toApiText(event.target.value));
				}}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-500"
					onClick={() => {
						setIsPicking((open) => !open);
					}}
				>
					<Plus className="h-3.5 w-3.5" aria-hidden="true" />
					Inserir dado automático
				</button>
				{isChanged && original && (
					<button
						type="button"
						className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
						onClick={() => {
							onChange(original.texto, original.titulo);
						}}
					>
						<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
						Desfazer alterações desta cláusula
					</button>
				)}
			</div>

			{isPicking && (
				<div className="flex flex-wrap gap-1.5 rounded-md bg-gray-50 p-2">
					{MARKERS.map((item) => (
						<button
							key={item.marker}
							type="button"
							className="rounded-full border border-primary-200 bg-white px-2.5 py-1 text-xs text-primary-800 hover:bg-primary-50"
							onClick={() => {
								insert(item.marker);
							}}
						>
							{item.label}
						</button>
					))}
				</div>
			)}

			{(removed.length > 0 || unknown.length > 0) && (
				<div className="flex flex-col gap-1 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
					{removed.length > 0 && (
						<p className="flex gap-1">
							<AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
							Você tirou {removed.map(labelOf).join(", ")}. Esse dado não vai
							mais aparecer nesta cláusula.
						</p>
					)}
					{unknown.length > 0 && (
						<p className="flex gap-1">
							<AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
							{unknown.join(", ")} não é um dado automático: vai sair escrito
							assim no contrato. Use "Inserir dado automático".
						</p>
					)}
				</div>
			)}
		</div>
	);
};

/**
 * Edits a contract model. Vibratto's sections (introduction, object, value,
 * signatures) are shown locked; the others are open text
 */
export const ContractModelEditor = ({
	model,
	onSave,
	onCancel,
	onPreview,
}: ContractModelEditorProps) => {
	const [draft, setDraft] = useState<ContractModel>(model);
	const [errors, setErrors] = useState<Array<string>>([]);

	const sections = useMemo(
		() => [...draft.secoes].sort((a, b) => a.numero - b.numero),
		[draft.secoes]
	);
	const changed = changedSections(model, draft).length;
	const isDirty = isModelChanged(model, draft);
	const { first: firstMovable, last: lastMovable } = movableRange(sections);
	// The clause just added: focused so the person types its title
	const [focusId, setFocusId] = useState<number | null>(null);

	const setSections = (secoes: Array<ContractModelSection>) => {
		setDraft((current) => ({ ...current, secoes }));
		setErrors([]);
	};

	const setSection = (
		sectionId: number,
		change: Partial<Pick<ContractModelSection, "titulo" | "texto">>
	) => {
		setDraft((current) => ({
			...current,
			secoes: current.secoes.map((section) =>
				section.id === sectionId ? { ...section, ...change } : section
			),
		}));
		setErrors([]);
	};

	const save = () => {
		const problems = modelErrors(draft);
		setErrors(problems);
		if (problems.length === 0) onSave(mergeEditable(model, draft));
	};

	return (
		<div className="flex flex-col gap-5">
			<button
				type="button"
				className="inline-flex items-center gap-1 self-start text-sm text-gray-600 hover:text-primary-600"
				onClick={() => {
					if (
						!isDirty ||
						window.confirm("Sair sem salvar? As alterações serão perdidas.")
					)
						onCancel();
				}}
			>
				<ArrowLeft className="h-4 w-4" aria-hidden="true" />
				Voltar aos modelos
			</button>

			<div className="flex flex-col gap-1">
				<label
					htmlFor="contract-model-name"
					className="text-sm font-medium text-gray-700"
				>
					Nome do modelo
				</label>
				<input
					id="contract-model-name"
					className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
					value={draft.nome}
					maxLength={80}
					onChange={(event) => {
						setDraft((current) => ({ ...current, nome: event.target.value }));
						setErrors([]);
					}}
				/>
			</div>

			<p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
				<Lock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
				As cláusulas com cadeado são definidas pela Vibratto e valem para todos
				os contratos. As outras você pode adaptar. Os{" "}
				<span className="rounded bg-primary-100 px-1 text-primary-800">
					dados automáticos
				</span>{" "}
				são preenchidos com as informações de cada proposta.
			</p>

			<ol className="flex flex-col gap-4">
				{sections.map((section, index) => (
					<li
						key={section.id}
						className={`rounded-lg border p-4 ${
							section.editavel
								? "border-gray-200 bg-white"
								: "border-gray-100 bg-gray-50"
						}`}
					>
						{section.editavel ? (
							<div className="mb-2 flex items-start gap-1">
								<input
									aria-label="Título da cláusula"
									autoFocus={section.id === focusId}
									onFocus={(event) => {
										if (section.id === focusId) {
											event.target.select();
											setFocusId(null);
										}
									}}
									className="-ml-2 min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-sm font-semibold text-gray-900 hover:border-gray-200 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
									value={section.titulo}
									maxLength={150}
									onChange={(event) => {
										setSection(section.id, { titulo: event.target.value });
									}}
								/>
								<div className="flex shrink-0 items-center">
									<button
										type="button"
										aria-label={`Subir "${section.titulo}"`}
										title="Subir"
										disabled={index <= firstMovable}
										className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
										onClick={() => {
											setSections(moveClause(sections, section.id, -1));
										}}
									>
										<ArrowUp className="h-4 w-4" />
									</button>
									<button
										type="button"
										aria-label={`Descer "${section.titulo}"`}
										title="Descer"
										disabled={index >= lastMovable}
										className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-30"
										onClick={() => {
											setSections(moveClause(sections, section.id, 1));
										}}
									>
										<ArrowDown className="h-4 w-4" />
									</button>
									{isNewClause(section) && (
										<button
											type="button"
											aria-label={`Remover "${section.titulo}"`}
											title="Remover cláusula"
											className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
											onClick={() => {
												if (
													!section.texto.trim() ||
													window.confirm(
														`Remover a cláusula "${section.titulo}"?`
													)
												)
													setSections(removeClause(sections, section.id));
											}}
										>
											<Trash2 className="h-4 w-4" />
										</button>
									)}
								</div>
							</div>
						) : (
							<h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
								<Lock
									className="h-4 w-4 shrink-0 text-gray-400"
									aria-label="Definida pela Vibratto"
								/>
								{section.titulo}
							</h4>
						)}
						{section.editavel ? (
							<EditableSection
								section={section}
								original={model.secoes.find((s) => s.id === section.id)}
								onChange={(texto, titulo) => {
									setSection(
										section.id,
										titulo ? { texto, titulo } : { texto }
									);
								}}
							/>
						) : (
							<TextWithMarkers text={section.texto} />
						)}
					</li>
				))}
			</ol>

			<button
				type="button"
				className="-mt-2 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-primary-700 hover:border-primary-300 hover:bg-primary-50"
				onClick={() => {
					const { sections: next, id } = addClause(sections);
					setFocusId(id);
					setSections(next);
				}}
			>
				<Plus className="h-4 w-4" aria-hidden="true" />
				Adicionar cláusula
				<span className="font-normal text-gray-500">
					(entra antes das assinaturas)
				</span>
			</button>

			{errors.length > 0 && (
				<ul
					className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700"
					role="alert"
				>
					{errors.map((error) => (
						<li key={error}>{error}</li>
					))}
				</ul>
			)}

			{/* Always in reach on a long contract */}
			<div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
				<span className="text-xs text-gray-500">
					{isDirty
						? changed > 0
							? `${changed} ${changed === 1 ? "cláusula alterada" : "cláusulas alteradas"}, não salvo`
							: "Alterações não salvas"
						: "Sem alterações"}
				</span>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="flex flex-1 gap-2 sm:flex-none"
						onClick={() => {
							onPreview(mergeEditable(model, draft));
						}}
					>
						<Eye className="h-4 w-4" aria-hidden="true" />
						Ver como fica
					</Button>
					<Button
						type="button"
						size="sm"
						className="flex-1 sm:flex-none"
						disabled={!isDirty}
						onClick={save}
					>
						Salvar modelo
					</Button>
				</div>
			</div>
		</div>
	);
};

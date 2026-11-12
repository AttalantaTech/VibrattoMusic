import type { ReactNode } from "react";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	rectSortingStrategy,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { moveFile } from "../../utils/fileOrder";

interface SortableFilesProps<T extends { link: string }> {
	files: Array<T>;
	/** The list in its new order, once a file is dropped somewhere else */
	onReorder?: (ordered: Array<T>) => void;
	children: ReactNode;
}

/**
 * The files of a section, which can be dragged into another order. Each file
 * inside is a SortableFile
 */
export function SortableFiles<T extends { link: string }>({
	files,
	onReorder,
	children,
}: SortableFilesProps<T>) {
	const sensors = useSensors(
		// A few pixels before it counts as dragging, so a press is still a press
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;

		const ordered = moveFile(files, String(active.id), String(over.id));
		if (ordered !== files) onReorder?.(ordered);
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={files.map((file) => file.link)}
				strategy={rectSortingStrategy}
			>
				{children}
			</SortableContext>
		</DndContext>
	);
}

interface SortableFileProps {
	link: string;
	/** Shown on the handle, e.g. "Mover imagem 2" */
	label: string;
	/** A single file has nowhere to go: no handle */
	canMove: boolean;
	children: ReactNode;
}

/**
 * One file of the grid. It is moved by its handle and not by the whole
 * square, which has the caption field and the remove button inside
 */
export function SortableFile({
	link,
	label,
	canMove,
	children,
}: SortableFileProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: link, disabled: !canMove });

	return (
		<div
			ref={setNodeRef}
			className={`relative px-1 ${isDragging ? "z-30 opacity-80" : ""}`}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			{canMove && (
				<button
					ref={setActivatorNodeRef}
					type="button"
					aria-label={label}
					title="Arraste para mudar a ordem"
					// touch-none: on a phone the drag would scroll the page instead
					className="absolute left-2 top-1 z-20 flex h-7 w-7 touch-none cursor-grab items-center justify-center rounded-full bg-gray-200 text-gray-800 shadow-sm transition-colors hover:bg-gray-300 active:cursor-grabbing"
					{...attributes}
					{...listeners}
				>
					<GripVertical className="h-4 w-4" aria-hidden="true" />
				</button>
			)}
			{children}
		</div>
	);
}

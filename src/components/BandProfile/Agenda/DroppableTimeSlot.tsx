import { useDroppable } from "@dnd-kit/core";
import type { DroppableTimeSlotProps } from "./types";

export const DroppableTimeSlot = ({
	id,
	hour,
	dayIndex,
	day,
	className = "",
	children,
	onClick,
}: DroppableTimeSlotProps) => {
	const { isOver, setNodeRef } = useDroppable({
		id,
		data: {
			type: "timeslot",
			hour,
			dayIndex,
			day,
		},
	});

	return (
		<div
			ref={setNodeRef}
			onClick={onClick}
			className={`h-20 border-r border-b border-gray-100 relative transition-colors cursor-pointer ${
				isOver ? "bg-primary-50 border-primary-200" : "hover:bg-gray-50"
			} ${className}`}
		>
			{/* Hour line marker for midday */}
			{hour === 12 && (
				<div className="absolute inset-x-0 top-1/2 h-px bg-gray-200 opacity-50" />
			)}
			{children}
		</div>
	);
};

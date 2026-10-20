import type { StageElement } from "./types";

// Icon and label scale with the element: at the default 80px the icon is
// 40px (the former w-10 h-10) and the label 12px (the former text-xs)
export const StageElementContent = ({ element }: { element: StageElement }) => {
	const iconSize = element.width * 0.5;
	const fontSize = Math.max(9, element.width * 0.15);

	return (
		<>
			<img
				src={element.icon}
				alt={element.name}
				draggable={false}
				style={{ width: iconSize, height: iconSize }}
			/>
			<span
				className="w-full text-center font-medium text-gray-700 mt-1 leading-tight truncate px-1"
				style={{ fontSize }}
			>
				{element.name}
			</span>
		</>
	);
};

import { useState, useRef, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MapPin, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import type { DraggableEventProps } from "./types";
import { eventTypeConfig } from "./types";
import { getEventHeight, formatTimeToHHMM } from "./utils";

export const DraggableEvent = ({
	event,
	style,
	onClick,
}: DraggableEventProps) => {
	const [showPreview, setShowPreview] = useState(false);
	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `event-${event.id}`,
			data: {
				type: "event",
				event,
			},
		});

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (hoverTimeoutRef.current) {
				clearTimeout(hoverTimeoutRef.current);
			}
		};
	}, []);

	const dragStyle = {
		transform: CSS.Translate.toString(transform),
		opacity: isDragging ? 0.5 : 1,
		zIndex: isDragging ? 1000 : 1,
		...style,
	};

	const config = eventTypeConfig[event.type];
	const eventHeight = getEventHeight(event);

	// Handle keyboard navigation for the click area
	const handleKeyDown = (keyEvent: React.KeyboardEvent) => {
		if (keyEvent.key === "Enter" || keyEvent.key === " ") {
			keyEvent.preventDefault();
			onClick();
		}
	};

	const handleMouseEnter = () => {
		// Show preview after 500ms delay
		hoverTimeoutRef.current = setTimeout(() => {
			setShowPreview(true);
		}, 500);
	};

	const handleMouseLeave = () => {
		// Clear timeout and hide preview
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		setShowPreview(false);
	};

	return (
		<Popover open={showPreview && !isDragging}>
			<PopoverTrigger asChild>
				<div
					ref={setNodeRef}
					style={dragStyle}
					className={`absolute pointer-events-auto select-none
						${config.lightColor} ${config.borderColor} border-l-4 rounded-md
						hover:shadow-lg hover:z-20 transition-all duration-200
						${isDragging ? "shadow-2xl ring-2 ring-blue-400" : ""}`}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				>
					{/* DRAG AREA - Barra superior dedicada ao drag */}
					<div
						className="h-4 w-full bg-gradient-to-b from-black/5 to-transparent cursor-move
					rounded-t-md flex items-center justify-center hover:from-black/10 transition-colors"
						{...listeners}
						{...attributes}
						title="Arraste para mover o evento"
					>
						{/* Indicador visual de drag - 3 linhas horizontais */}
						<div className="flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
							<div className="w-4 h-0.5 bg-gray-500 rounded-full"></div>
							<div className="w-4 h-0.5 bg-gray-500 rounded-full"></div>
							<div className="w-4 h-0.5 bg-gray-500 rounded-full"></div>
						</div>
					</div>

					{/* CLICK AREA - Área principal clicável */}
					<button
						type="button"
						onClick={onClick}
						onKeyDown={handleKeyDown}
						className="w-full cursor-pointer hover:bg-white/10 transition-colors
					text-left focus:outline-none focus:ring-2 focus:ring-blue-400
					focus:ring-opacity-50 active:bg-white/20 rounded-b-md"
						style={{
							height: `calc(100% - 16px)`, // 100% minus drag area height
							minHeight: "24px",
							padding: "8px",
						}}
						title={`Clique para ver detalhes: ${event.title}`}
						aria-label={`Evento ${event.title}. Clique para detalhes.`}
						tabIndex={0}
					>
						{/* Event content */}
						<div
							className={`text-sm font-semibold ${config.textColor} truncate`}
						>
							{event.title}
						</div>
						{eventHeight > 50 && (
							<>
								<div className="text-xs text-gray-600 mt-0.5">
									{formatTimeToHHMM(event.startTime)} -{" "}
									{formatTimeToHHMM(event.endTime)}
								</div>
								{eventHeight > 70 && event.location && (
									<div className="text-xs text-gray-500 mt-1 truncate flex items-center gap-1">
										<MapPin size={10} />
										{event.location}
									</div>
								)}
							</>
						)}
					</button>

					{/* Status indicator */}
					{event.status === "pending" && (
						<div
							className="absolute top-1 left-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse z-30"
							title="Pendente de confirmação"
						/>
					)}
				</div>
			</PopoverTrigger>
			<PopoverContent className="w-72 p-0" sideOffset={12}>
				{/* Event type indicator */}
				<div className="p-5">
					<div className="flex items-start gap-3 mb-4">
						<div
							className="w-5 h-5 rounded-md mt-0.5 shadow-sm"
							style={{ backgroundColor: config.color }}
						/>
						<div className="flex-1">
							<h4 className="font-semibold text-gray-900 text-base">
								{event.title}
							</h4>
							<p className="text-xs text-gray-500 font-medium mt-0.5">
								{config.label}
							</p>
						</div>
					</div>

					{/* Time */}
					<div className="flex items-center gap-3 text-sm text-gray-600 mb-3 bg-gray-50 rounded-lg px-3 py-2">
						<Clock className="w-4 h-4 text-gray-500" />
						<span className="font-medium">
							{formatTimeToHHMM(event.startTime)} -{" "}
							{formatTimeToHHMM(event.endTime)}
						</span>
					</div>

					{/* Location */}
					{event.location && (
						<div className="flex items-center gap-3 text-sm text-gray-600 mb-3 bg-gray-50 rounded-lg px-3 py-2">
							<MapPin className="w-4 h-4 text-gray-500" />
							<span className="font-medium">{event.location}</span>
						</div>
					)}

					{/* Description */}
					{event.description && (
						<div className="mt-3 pt-3 border-t border-gray-100">
							<p className="text-sm text-gray-600 leading-relaxed">
								{event.description}
							</p>
						</div>
					)}

					{/* Quick action hint */}
					<p className="text-xs text-gray-400 mt-4 italic text-center bg-gray-50 rounded-lg py-2">
						Clique para ver mais detalhes
					</p>
				</div>
			</PopoverContent>
		</Popover>
	);
};

import { useEffect, useRef, useState } from "react";
import type { StageElement, StageMapData } from "./types";
import { STAGE_COLORS, STAGE_CONFIG } from "./types";

import type { FilterOptionInstrument } from "@/api/types";
import type { MusicalProduct } from "@/components/BandProfileSwitcher";

interface StageMapAreaProps {
	musicalProduct: MusicalProduct | null;
	instrumentsData: Array<FilterOptionInstrument> | undefined;
}

function convertStageMapDataToElements(
	stageMapData: Array<StageMapData>,
	instrumentsData: Array<FilterOptionInstrument>
): Array<StageElement> {
	return stageMapData
		.map((item, index) => {
			const instrument = instrumentsData.find(
				(inst) => inst.Id === item.idInstrumento
			);
			if (!instrument) {
				return null;
			}

			return {
				id: `saved-element-${item.idInstrumento}-${index}`,
				name: instrument.Nome,
				x: item.posicaoX,
				y: item.posicaoY,
				icon: instrument.Icone,
				category:
					instrument.IdTipoEquipamento === 1
						? ("instrument" as const)
						: ("infrastructure" as const),
				color:
					instrument.IdTipoEquipamento === 1
						? STAGE_COLORS.instrument
						: STAGE_COLORS.infrastructure,
				instrumentId: item.idInstrumento,
				idTipoEquipamento: instrument.IdTipoEquipamento,
				width: 80,
				height: 80,
			};
		})
		.filter(Boolean) as Array<StageElement>;
}

export const StageMapArea = ({
	musicalProduct,
	instrumentsData,
}: StageMapAreaProps) => {
	const stageRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const [scale, setScale] = useState(1);
	const [elements, setElements] = useState<Array<StageElement>>([]);

	useEffect(() => {
		const newElements = convertStageMapDataToElements(
			musicalProduct?.mapaPalco ?? [],
			instrumentsData ?? []
		);

		setElements(newElements);
	}, [instrumentsData, musicalProduct?.mapaPalco]);

	useEffect(() => {
		if (!containerRef.current) return;

		const containerWidth = containerRef.current.clientWidth;
		const containerHeight = containerRef.current.clientHeight;

		const scaleX = containerWidth / STAGE_CONFIG.STAGE_WIDTH;
		const scaleY = containerHeight / STAGE_CONFIG.STAGE_HEIGHT;

		// Maintains proportion
		const nextScale = Math.min(scaleX, scaleY, 1);

		setScale(nextScale);
	}, []);

	return (
		<div ref={containerRef} className="flex-1 p-6 overflow-auto scroll-smooth">
			<div
				className="mx-auto"
				style={{
					width: STAGE_CONFIG.STAGE_WIDTH * scale,
					height: STAGE_CONFIG.STAGE_HEIGHT * scale,
				}}
			>
				<div
					ref={stageRef}
					className="relative bg-gray-50 rounded-lg shadow-lg border-2 border-gray-300"
					style={{
						width: STAGE_CONFIG.STAGE_WIDTH,
						height: STAGE_CONFIG.STAGE_HEIGHT,
						transform: `scale(${scale})`,
						transformOrigin: "top left",
					}}
				>
					{/* Grid */}
					<div className="absolute inset-0 opacity-20" />

					{/* Stage Elements */}
					{elements.map((element) => {
						return (
							<div
								role="button"
								key={element.id}
								className={`absolute rounded-lg flex flex-col items-center justify-center transition-all duration-200 cursor-default`}
								style={{
									left: element.x,
									top: element.y,
									width: element.width,
									height: element.height,
								}}
							>
								<div>
									<img
										className="w-10 h-10"
										src={element.icon}
										alt={element.name}
									/>
								</div>
								<span className="text-xs text-center font-medium text-gray-700 mt-1">
									{element.name}
								</span>
							</div>
						);
					})}

					{/* Audience Indicator */}
					<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
						Frente (Plateia)
					</div>
				</div>
			</div>
		</div>
	);
};

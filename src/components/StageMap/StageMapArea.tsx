import { useEffect, useRef, useState } from "react";
import type { StageElement, StageMapData } from "./types";
import { STAGE_COLORS, STAGE_CONFIG } from "./types";
import {
	Drum,
	Guitar,
	KeyboardMusic,
	MicVocal,
	Music,
	Volume2,
} from "lucide-react";
import type { FilterOption } from "@/api/types";
import type { MusicalProduct } from "@/components/BandProfileSwitcher";

interface StageMapAreaProps {
	musicalProduct: MusicalProduct | null;
	instrumentsData: Array<FilterOption> | undefined;
}

function getInstrumentIcon(instrumentName: string) {
	const name = instrumentName.toLowerCase();
	if (name.includes("guitarra") || name.includes("guitar"))
		return <Guitar size={24} />;
	if (name.includes("bateria") || name.includes("drum"))
		return <Drum size={24} />;
	if (name.includes("microfone") || name.includes("mic"))
		return <MicVocal size={24} />;
	if (name.includes("teclado") || name.includes("keyboard"))
		return <KeyboardMusic size={24} />;
	if (name.includes("baixo") || name.includes("bass"))
		return <Music size={24} />;
	if (name.includes("amplificador") || name.includes("amp"))
		return <Volume2 size={24} />;
	return <MicVocal size={24} />;
}

function convertStageMapDataToElements(
	stageMapData: Array<StageMapData>,
	instrumentsData: Array<FilterOption>
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
				icon: getInstrumentIcon(instrument.Nome),
				category: "instrument" as const,
				color: STAGE_COLORS.instrument,
				instrumentId: item.idInstrumento,
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
		<div
			ref={containerRef}
			className="flex-1 bg-gray-100 p-6 overflow-auto scroll-smooth"
		>
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
					<div
						className="absolute inset-0 opacity-20"
						style={{
							backgroundImage: `
												linear-gradient(to right, #9CA3AF 1px, transparent 1px),
												linear-gradient(to bottom, #9CA3AF 1px, transparent 1px)
											`,
							backgroundSize: "40px 40px",
						}}
					/>

					{/* Stage Elements */}
					{elements.map((element) => {
						return (
							<div
								role="button"
								key={element.id}
								className={`absolute rounded-lg flex flex-col items-center justify-center transition-all duration-200`}
								style={{
									left: element.x,
									top: element.y,
									width: element.width,
									height: element.height,
									backgroundColor: "white",
									borderWidth: "2px",
									borderColor: element.color,
								}}
							>
								<div style={{ color: element.color }}>{element.icon}</div>
								<span className="text-xs font-medium text-gray-700 mt-1">
									{element.name}
								</span>
							</div>
						);
					})}

					{/* Audience Indicator */}
					<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
						Frente (Plateia)
					</div>
				</div>
			</div>
		</div>
	);
};

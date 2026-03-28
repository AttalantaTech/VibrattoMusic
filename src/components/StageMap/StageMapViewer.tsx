import { useState, useEffect } from "react";
import { MapIcon, Edit } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import type {
	StageElement,
	StageMapViewerProps,
} from "@/components/StageMap/types";
import { StageMapBuilder } from "@/components/StageMap/StageMapBuilder";

export const StageMapViewer = ({
	stageData = [],
	onSave,
	editable = false,
}: StageMapViewerProps) => {
	const [isBuilderOpen, setIsBuilderOpen] = useState(false);
	const [stageElements, setStageElements] = useState<Array<StageElement>>([]);

	// Convert API data to internal format
	useEffect(() => {
		if (stageData && stageData.length > 0) {
			const convertedElements: Array<StageElement> = stageData.map(
				(item, index) => ({
					id: `${item.idInstrumento}-${index}`,
					name: `Instrumento ${item.idInstrumento}`, // This would need to be fetched from API
					instrumentName: `Instrumento ${item.idInstrumento}`, // For display purposes
					x: item.posicaoX,
					y: item.posicaoY,
					width: 8,
					height: 8,
					icon: <div>🎵</div>, // Placeholder icon
					category: "instrument" as const,
					color: "#FF6B35",
					instrumentId: item.idInstrumento,
				})
			);
			setStageElements(convertedElements);
		}
	}, [stageData]);

	const handleSave = (
		elements: Array<{
			idInstrumento: number;
			posicaoX: number;
			posicaoY: number;
		}>
	) => {
		if (onSave) {
			onSave(elements);
		}
		setIsBuilderOpen(false);
	};

	if (stageElements.length === 0) {
		return (
			<div className="bg-white rounded-lg border-2 border-gray-200 p-6">
				<div className="flex flex-col items-center text-center gap-4">
					<div className="bg-gray-100 h-16 w-16 flex items-center justify-center rounded-full">
						<MapIcon size={32} className="text-gray-400" />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-gray-700 mb-2">
							Nenhum mapa de palco definido
						</h3>
						<p className="text-gray-500 text-sm mb-4">
							Configure o layout de instrumentos e equipamentos no palco
						</p>
						{editable && (
							<Button
								onClick={() => {
									setIsBuilderOpen(true);
								}}
								className="flex items-center gap-2"
							>
								<MapIcon size={16} />
								Criar Mapa de Palco
							</Button>
						)}
					</div>
				</div>

				{editable && (
					<StageMapBuilder
						isOpen={isBuilderOpen}
						onClose={() => {
							setIsBuilderOpen(false);
						}}
						onSave={handleSave}
						initialElements={stageElements}
					/>
				)}
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg border-2 border-gray-200 p-6">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<MapIcon size={20} className="text-primary-600" />
					<h3 className="text-lg font-semibold text-gray-700">Mapa do Palco</h3>
				</div>
				{editable && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setIsBuilderOpen(true);
						}}
						className="flex items-center gap-2"
					>
						<Edit size={16} />
						Editar
					</Button>
				)}
			</div>

			{/* Stage Preview */}
			<div className="relative w-full h-64 bg-gradient-to-b from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
				{/* Grid Pattern */}
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage: `
							linear-gradient(to right, #e5e7eb 1px, transparent 1px),
							linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
						`,
						backgroundSize: "5% 6.25%",
					}}
				/>

				{/* Stage Front Indicator */}
				<div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
					<div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
						PLATEIA
					</div>
				</div>

				{/* Stage Elements */}
				{stageElements.map((element) => (
					<div
						key={element.id}
						className="absolute bg-primary-500 text-white text-xs font-medium rounded-lg border-2 border-primary-600 flex items-center justify-center shadow-lg"
						style={{
							left: `${element.x}%`,
							top: `${element.y}%`,
							width: `${element.width}%`,
							height: `${element.height}%`,
						}}
						title={element.instrumentName}
					>
						<span className="truncate px-1">{element.instrumentName}</span>
					</div>
				))}
			</div>

			{/* Stage Info */}
			<div className="mt-4 p-3 bg-gray-50 rounded-lg">
				<h4 className="font-medium text-sm text-gray-700 mb-2">
					Instrumentos Posicionados ({stageElements.length})
				</h4>
				{stageElements.length > 0 ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
						{stageElements.map((element) => (
							<div
								key={element.id}
								className="flex items-center gap-2 text-sm text-gray-600"
							>
								<div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
								<span className="truncate">{element.instrumentName}</span>
							</div>
						))}
					</div>
				) : (
					<p className="text-gray-500 text-sm">
						Nenhum instrumento posicionado
					</p>
				)}
			</div>

			{editable && (
				<StageMapBuilder
					isOpen={isBuilderOpen}
					onClose={() => {
						setIsBuilderOpen(false);
					}}
					onSave={handleSave}
					initialElements={stageElements}
				/>
			)}
		</div>
	);
};

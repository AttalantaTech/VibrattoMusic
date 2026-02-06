import {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
	type ReactNode,
} from "react";
import {
	X,
	Save,
	Guitar,
	Drum,
	MicVocal,
	Volume2,
	KeyboardMusic,
	Zap,
	Undo,
	Redo,
	ZoomIn,
	ZoomOut,
	Grid3x3,
	Layers,
	Music,
	Search,
} from "lucide-react";
import {
	type StageElement,
	type StageMapData,
	type StageMapBuilderProps,
	type HistoryState,
	type UseStageHistoryReturn,
	type UseStageInteractionsReturn,
	STAGE_COLORS,
	STAGE_CONFIG,
} from "./types";

import { useInstrumentos } from "@/hooks/useFilters";

// Custom hooks
const useStageHistory = (
	initialElements: Array<StageElement>
): UseStageHistoryReturn => {
	const [history, setHistory] = useState<Array<HistoryState>>([
		{ elements: initialElements, timestamp: Date.now() },
	]);
	const [historyIndex, setHistoryIndex] = useState(0);

	const addToHistory = useCallback(
		(elements: Array<StageElement>) => {
			const newHistoryState: HistoryState = {
				elements: [...elements],
				timestamp: Date.now(),
			};

			const newHistory = history.slice(0, historyIndex + 1);
			newHistory.push(newHistoryState);

			if (newHistory.length > STAGE_CONFIG.HISTORY_LIMIT) {
				newHistory.shift();
			} else {
				setHistoryIndex(newHistory.length - 1);
			}

			setHistory(newHistory);
		},
		[history, historyIndex]
	);

	const undo = useCallback(() => {
		if (historyIndex > 0) {
			const newIndex = historyIndex - 1;
			setHistoryIndex(newIndex);
			return history[newIndex]?.elements || [];
		}
		return null;
	}, [history, historyIndex]);

	const redo = useCallback(() => {
		if (historyIndex < history.length - 1) {
			const newIndex = historyIndex + 1;
			setHistoryIndex(newIndex);
			return history[newIndex]?.elements || [];
		}
		return null;
	}, [history, historyIndex]);

	return {
		addToHistory,
		undo,
		redo,
		canUndo: historyIndex > 0,
		canRedo: historyIndex < history.length - 1,
	};
};

const useStageInteractions = (
	elements: Array<StageElement>,
	onElementsChange: (elements: Array<StageElement>) => void,
	addToHistory: (elements: Array<StageElement>) => void
): UseStageInteractionsReturn => {
	const [selectedElementId, setSelectedElementId] = useState<string | null>(
		null
	);
	const [draggedItem, setDraggedItem] = useState<StageElement | null>(null);

	const deleteElement = useCallback(
		(id: string) => {
			const newElements = elements.filter((element) => element.id !== id);
			onElementsChange(newElements);
			addToHistory(newElements);
			setSelectedElementId(null);
		},
		[elements, onElementsChange, addToHistory]
	);

	const duplicateElement = useCallback(
		(id: string) => {
			const elementToCopy = elements.find((element) => element.id === id);
			if (elementToCopy) {
				const newElement: StageElement = {
					...elementToCopy,
					id: `${elementToCopy.id}-copy-${Date.now()}`,
					x: Math.min(
						elementToCopy.x + 30,
						STAGE_CONFIG.STAGE_WIDTH - elementToCopy.width
					),
					y: Math.min(
						elementToCopy.y + 30,
						STAGE_CONFIG.STAGE_HEIGHT - elementToCopy.height
					),
					isSelected: false,
				};
				const newElements = [...elements, newElement];
				onElementsChange(newElements);
				addToHistory(newElements);
			}
		},
		[elements, onElementsChange, addToHistory]
	);

	const selectElement = useCallback((id: string | null) => {
		setSelectedElementId(id);
	}, []);

	return {
		selectedElementId,
		draggedItem,
		setDraggedItem,
		deleteElement,
		duplicateElement,
		selectElement,
	};
};

export function StageMapBuilder({
	isOpen,
	onClose,
	onSave,
	initialElements = [],
}: Readonly<StageMapBuilderProps>) {
	const [elements, setElements] =
		useState<Array<StageElement>>(initialElements);
	const [zoom, setZoom] = useState(1);
	const [showGrid, setShowGrid] = useState(true);
	const [instrumentSearch, setInstrumentSearch] = useState("");

	const stageRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const { data: instrumentsData, isLoading: loadingInstruments } =
		useInstrumentos();

	const { addToHistory, undo, redo, canUndo, canRedo } =
		useStageHistory(initialElements);
	const {
		selectedElementId,
		draggedItem,
		setDraggedItem,
		deleteElement,
		duplicateElement,
		selectElement,
	} = useStageInteractions(elements, setElements, addToHistory);

	// Update elements when initialElements changes
	useEffect(() => {
		setElements(initialElements);
	}, [initialElements]);

	// Get icon for instrument
	function getInstrumentIcon(instrumentName: string): ReactNode {
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

	// Instrument elements from API
	const instrumentElements: Array<StageElement> = useMemo(() => {
		if (!instrumentsData) return [];

		return instrumentsData.map((instrument) => ({
			id: `api-instrument-${instrument.Id}`,
			name: instrument.Nome,
			x: 0,
			y: 0,
			icon: getInstrumentIcon(instrument.Nome),
			category: "instrument" as const,
			color: STAGE_COLORS.instrument,
			instrumentId: instrument.Id,
			instrumentName: instrument.Nome,
			width: 80,
			height: 80,
		}));
	}, [instrumentsData]);

	// Filtered instruments based on search
	const filteredInstrumentElements = useMemo(() => {
		if (!instrumentSearch.trim()) {
			return instrumentElements;
		}
		return instrumentElements.filter((instrument) =>
			instrument.name.toLowerCase().includes(instrumentSearch.toLowerCase())
		);
	}, [instrumentElements, instrumentSearch]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (!isOpen) return;

			if (event.ctrlKey || event.metaKey) {
				switch (event.key) {
					case "z":
						event.preventDefault();
						if (event.shiftKey) {
							const redoElements = redo();
							if (redoElements) setElements(redoElements);
						} else {
							const undoElements = undo();
							if (undoElements) setElements(undoElements);
						}
						break;
					case "y":
						event.preventDefault();
						{
							const redoElements = redo();
							if (redoElements) setElements(redoElements);
						}
						break;
					case "c":
						if (selectedElementId) {
							event.preventDefault();
							duplicateElement(selectedElementId);
						}
						break;
				}
			} else {
				switch (event.key) {
					case "Delete":
					case "Backspace":
						if (selectedElementId) {
							event.preventDefault();
							deleteElement(selectedElementId);
						}
						break;
					case "Escape":
						event.preventDefault();
						selectElement(null);
						break;
				}
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		isOpen,
		selectedElementId,
		undo,
		redo,
		deleteElement,
		duplicateElement,
		selectElement,
	]);

	// Drag and drop handlers
	const handleDragStart = (element: StageElement) => {
		setDraggedItem(element);
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		if (!draggedItem || !stageRef.current) return;

		const stageRect = stageRef.current.getBoundingClientRect();
		const x = (event.clientX - stageRect.left) / zoom - draggedItem.width / 2;
		const y = (event.clientY - stageRect.top) / zoom - draggedItem.height / 2;
		const boundedX = Math.max(
			0,
			Math.min(x, STAGE_CONFIG.STAGE_WIDTH - draggedItem.width)
		);
		const boundedY = Math.max(
			0,
			Math.min(y, STAGE_CONFIG.STAGE_HEIGHT - draggedItem.height)
		);

		const newElement: StageElement = {
			...draggedItem,
			id: `${draggedItem.id}-${Date.now()}`,
			x: boundedX,
			y: boundedY,
			isSelected: false,
		};

		const newElements = [...elements, newElement];
		setElements(newElements);
		addToHistory(newElements);
		setDraggedItem(null);
	};

	const handleElementClick = (event: React.MouseEvent, elementId: string) => {
		event.stopPropagation();
		selectElement(elementId === selectedElementId ? null : elementId);
	};
	const handleElementDrag = (
		elementId: string,
		deltaX: number,
		deltaY: number
	) => {
		const newElements = elements.map((element) => {
			if (element.id === elementId) {
				const newX = Math.max(
					0,
					Math.min(element.x + deltaX, STAGE_CONFIG.STAGE_WIDTH - element.width)
				);
				const newY = Math.max(
					0,
					Math.min(
						element.y + deltaY,
						STAGE_CONFIG.STAGE_HEIGHT - element.height
					)
				);
				return { ...element, x: newX, y: newY };
			}
			return element;
		});
		setElements(newElements);
		return newElements; // Retorna os novos elementos para uso no mouseup
	};

	const handleSave = () => {
		const stageMapData: Array<StageMapData> = elements
			.filter((element) => element.instrumentId)
			.map((element) => ({
				idInstrumento: element.instrumentId!,
				posicaoX: element.x,
				posicaoY: element.y,
			}));

		onSave(stageMapData);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			{/* Main Container */}
			<div
				className="bg-white rounded-xl w-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden"
				style={{
					boxShadow:
						"0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)",
				}}
			>
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-blue-600 rounded-lg">
							<Layers className="w-6 h-6 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								Construtor de Mapa de Palco
							</h2>
							<p className="text-sm text-gray-500">
								Arraste elementos para organizar o palco
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<X className="w-6 h-6" />
					</button>
				</div>
				{/* Main Content */}
				<div className="flex flex-1 overflow-hidden">
					{/* Left Sidebar */}
					<div className="w-96 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
						<div className="p-6">
							{/* Tabs */}
							<div className="mb-6">
								<h3 className="text-lg font-semibold text-gray-800 mb-4">
									Elementos do Palco
								</h3>
								<p className="text-sm text-gray-600 mb-4">
									Arraste os elementos para organizar seu palco
								</p>
							</div>

							{/* Search */}
							<div className="relative mb-6">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input
									type="text"
									placeholder="Buscar instrumentos..."
									value={instrumentSearch}
									onChange={(event) => {
										setInstrumentSearch(event.target.value);
									}}
									className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>

							{/* Instrumentos */}
							<div className="mb-6">
								<h3 className="text-sm font-medium text-gray-700 mb-3">
									Instrumentos
								</h3>
								<div className="grid grid-cols-3 gap-3">
									{loadingInstruments ? (
										<div className="col-span-3 text-center py-4">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
										</div>
									) : filteredInstrumentElements.length > 0 ? (
										filteredInstrumentElements.map((element) => (
											<button
												key={element.id}
												draggable
												onDragStart={() => {
													handleDragStart(element);
												}}
												className="p-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg cursor-grab transition-all duration-200 flex flex-col items-center gap-2"
											>
												<div style={{ color: element.color }}>
													{element.icon}
												</div>
												<span className="text-xs text-gray-600 text-center leading-tight">
													{element.name}
												</span>
											</button>
										))
									) : (
										<div className="col-span-3 text-center py-4 text-gray-500 text-sm">
											Nenhum instrumento encontrado
										</div>
									)}
								</div>
							</div>

							{/* Infraestrutura */}
							<div className="mb-6">
								<h3 className="text-sm font-medium text-gray-700 mb-3">
									Infraestrutura
								</h3>
								<div className="grid grid-cols-2 gap-2">
									<button
										draggable
										onDragStart={() => {
											handleDragStart({
												id: "power-ac-120",
												name: "AC 120V",
												x: 0,
												y: 0,
												icon: <Zap size={24} />,
												category: "infrastructure",
												color: STAGE_COLORS.infrastructure,
												width: 60,
												height: 60,
											});
										}}
										className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
									>
										AC 120V
									</button>
									<button
										draggable
										onDragStart={() => {
											handleDragStart({
												id: "power-ac-240",
												name: "AC 240V",
												x: 0,
												y: 0,
												icon: <Zap size={24} />,
												category: "infrastructure",
												color: STAGE_COLORS.infrastructure,
												width: 60,
												height: 60,
											});
										}}
										className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
									>
										AC 240V
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Center - Stage Area */}
					<div
						className="flex-1 bg-gray-100 p-6 overflow-auto"
						ref={containerRef}
					>
						<div
							className="mx-auto"
							style={{
								width: STAGE_CONFIG.STAGE_WIDTH * zoom,
								height: STAGE_CONFIG.STAGE_HEIGHT * zoom,
							}}
						>
							<div
								ref={stageRef}
								className="relative bg-gray-50 rounded-lg shadow-lg border-2 border-gray-300 overflow-hidden"
								style={{
									width: STAGE_CONFIG.STAGE_WIDTH,
									height: STAGE_CONFIG.STAGE_HEIGHT,
									transform: `scale(${zoom})`,
									transformOrigin: "top left",
								}}
								onDragOver={handleDragOver}
								onDrop={handleDrop}
								onClick={() => {
									selectElement(null);
								}}
							>
								{/* Grid */}
								{showGrid && (
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
								)}

								{/* Stage Elements */}
								{elements.map((element) => {
									const isSelected = selectedElementId === element.id;

									return (
										<div
											role="button"
											key={element.id}
											className={`absolute rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${
												isSelected
													? "ring-2 ring-blue-500 shadow-xl scale-105 z-10"
													: "hover:shadow-lg hover:scale-102 shadow-md"
											}`}
											style={{
												left: element.x,
												top: element.y,
												width: element.width,
												height: element.height,
												backgroundColor: isSelected
													? `${element.color}20`
													: "white",
												borderWidth: "2px",
												borderColor: element.color,
											}}
											onClick={(event) => {
												handleElementClick(event, element.id);
											}}
											onMouseDown={(event) => {
												event.preventDefault();
												event.stopPropagation();
												const startX = event.clientX;
												const startY = event.clientY;
												let latestElements = elements;
												let hasMoved = false;

												const handleMouseMove = (moveEvent: MouseEvent) => {
													moveEvent.preventDefault();
													moveEvent.stopPropagation();
													const deltaX = (moveEvent.clientX - startX) / zoom;
													const deltaY = (moveEvent.clientY - startY) / zoom;

													if (
														!hasMoved &&
														(Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)
													) {
														hasMoved = true;
													}

													latestElements = handleElementDrag(
														element.id,
														deltaX,
														deltaY
													);
												};

												const handleMouseUp = (upEvent: MouseEvent) => {
													upEvent.preventDefault();
													upEvent.stopPropagation();
													document.removeEventListener(
														"mousemove",
														handleMouseMove
													);
													document.removeEventListener(
														"mouseup",
														handleMouseUp
													);

													if (hasMoved) {
														addToHistory(latestElements);
													}
												};

												document.addEventListener("mousemove", handleMouseMove);
												document.addEventListener("mouseup", handleMouseUp);
											}}
										>
											<div style={{ color: element.color }}>{element.icon}</div>
											<span className="text-xs font-medium text-gray-700 mt-1">
												{element.name}
											</span>

											<button
												type="button"
												onClick={() => {
													deleteElement(element.id);
												}}
												className="absolute top-0 right-0 text-blue-500 hover:text-blue-700 rounded-full p-1 transition-colors"
											>
												<X className="w-5 h-5" />
											</button>
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

					{/* Right Sidebar - Controls */}
					<div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
						<div className="p-6 space-y-6">
							{/* View Controls */}
							<div>
								<h4 className="text-sm font-medium text-gray-700 mb-4">
									Visualização
								</h4>
								<div className="space-y-3">
									{/* Zoom Control */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">Zoom</span>
										<div className="flex items-center gap-2">
											<button
												onClick={() => {
													setZoom(Math.max(zoom - 0.1, STAGE_CONFIG.MIN_ZOOM));
												}}
												className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
											>
												<ZoomOut className="w-4 h-4" />
											</button>
											<span className="w-14 text-center text-sm font-medium">
												{Math.round(zoom * 100)}%
											</span>
											<button
												onClick={() => {
													setZoom(Math.min(zoom + 0.1, STAGE_CONFIG.MAX_ZOOM));
												}}
												className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
											>
												<ZoomIn className="w-4 h-4" />
											</button>
										</div>
									</div>

									{/* Grid Toggle */}
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-600">Grade</span>
										<button
											onClick={() => {
												setShowGrid(!showGrid);
											}}
											className={`p-2 rounded-lg transition-all ${
												showGrid
													? "bg-blue-100 text-blue-600"
													: "bg-gray-200 text-gray-400 hover:bg-gray-300"
											}`}
										>
											<Grid3x3 className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>

							{/* Actions */}
							<div>
								<h4 className="text-sm font-medium text-gray-700 mb-4">
									Ações
								</h4>
								<div className="flex gap-2">
									<button
										onClick={() => {
											const undoElements = undo();
											if (undoElements) setElements(undoElements);
										}}
										disabled={!canUndo}
										className="flex-1 p-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
									>
										<Undo className="w-4 h-4" />
										<span className="text-sm">Desfazer</span>
									</button>
									<button
										onClick={() => {
											const redoElements = redo();
											if (redoElements) setElements(redoElements);
										}}
										disabled={!canRedo}
										className="flex-1 p-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
									>
										<Redo className="w-4 h-4" />
										<span className="text-sm">Refazer</span>
									</button>
								</div>
							</div>

							{/* Stage Info */}
							<div>
								<h4 className="text-sm font-medium text-gray-700 mb-4">
									Informações
								</h4>
								<div className="space-y-3">
									<div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
										<span className="text-sm text-gray-700">Instrumentos</span>
										<span className="text-lg font-bold text-blue-600">
											{
												elements.filter(
													(element) => element.category === "instrument"
												).length
											}
										</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
										<span className="text-sm text-gray-700">
											Infraestrutura
										</span>
										<span className="text-lg font-bold text-green-600">
											{
												elements.filter(
													(element) => element.category === "infrastructure"
												).length
											}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between p-6 border-t border-gray-200">
					<div className="text-sm text-gray-500">
						{selectedElementId
							? "Use Delete para remover • Ctrl+C para duplicar"
							: "Arraste elementos para o palco"}
					</div>

					<div className="flex gap-3">
						<button
							onClick={onClose}
							className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-200"
						>
							Cancelar
						</button>
						<button
							onClick={handleSave}
							className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
						>
							<Save className="w-4 h-4" />
							Salvar Mapa
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

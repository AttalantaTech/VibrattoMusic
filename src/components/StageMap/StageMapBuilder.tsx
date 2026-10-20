import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
	X,
	Save,
	Undo,
	Redo,
	ZoomIn,
	ZoomOut,
	Grid3x3,
	Layers,
	Plus,
	RotateCw,
	Search,
	Trash2,
} from "lucide-react";
import {
	type StageElement,
	type StageMapBuilderProps,
	type HistoryState,
	type UseStageHistoryReturn,
	type UseStageInteractionsReturn,
	STAGE_CONFIG,
	STAGE_ELEMENT_SIZE,
} from "./types";
import {
	convertElementsToStageMapData,
	createStageElement,
} from "./stageMapHelpers";
import { StageElementContent } from "./StageElementContent";

import { useInstrumentos } from "@/hooks/useFilters";
import { TabNavigation } from "../ui/TabNavigation/TabNavigation";
import { Button } from "../ui/Button/Button";
import { useDeviceType } from "@/hooks/useDeviceType";

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
	const [infrastructureSearch, setInfrastructureSearch] = useState("");
	const [activeTab, setActiveTab] = useState<string>("instrument");

	// Secondary tabs for gallery
	const secondaryTabs = [
		{ label: "Instrumentos", value: "instrument" },
		{ label: "Infraestrutura de Palco", value: "infrastructure" },
	];

	const stageRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Phones and tablets get a compact, full-screen layout
	const isCompact = useDeviceType() !== "desktop";
	const [isCatalogOpen, setIsCatalogOpen] = useState(false);

	// Compact layout: fit the whole stage to the available width when it
	// opens and when the width changes (e.g. rotating the phone). Height
	// changes (panels opening) keep the zoom the user chose
	useEffect(() => {
		const container = containerRef.current;
		if (!isOpen || !isCompact || !container) return;

		let lastWidth = 0;
		const fitToWidth = () => {
			const width = container.clientWidth;
			if (width === lastWidth) return;
			lastWidth = width;

			const padding = 16; // p-2 on both sides
			const fittedZoom = (width - padding) / STAGE_CONFIG.STAGE_WIDTH;
			setZoom(Math.min(1, Math.max(STAGE_CONFIG.MIN_ZOOM, fittedZoom)));
		};

		fitToWidth();
		const observer = new ResizeObserver(fitToWidth);
		observer.observe(container);
		return () => {
			observer.disconnect();
		};
	}, [isOpen, isCompact]);

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

	// Instrument elements from API
	const instrumentElements: Array<StageElement> = useMemo(
		() =>
			(instrumentsData ?? []).map((instrument) =>
				createStageElement(instrument)
			),
		[instrumentsData]
	);

	// Latest elements for handlers that run after a re-render (size slider)
	const elementsRef = useRef(elements);
	useEffect(() => {
		elementsRef.current = elements;
	}, [elements]);

	const selectedElement = elements.find(
		(element) => element.id === selectedElementId
	);

	// Filtered instruments based on search
	const filteredInstrumentElements = useMemo(() => {
		if (activeTab === "instrument") {
			if (!instrumentSearch.trim()) {
				return instrumentElements;
			}
			return instrumentElements.filter((instrument) =>
				instrument.name.toLowerCase().includes(instrumentSearch.toLowerCase())
			);
		}

		if (!infrastructureSearch.trim()) {
			return instrumentElements;
		}
		return instrumentElements.filter((instrument) =>
			instrument.name.toLowerCase().includes(infrastructureSearch.toLowerCase())
		);
	}, [instrumentElements, instrumentSearch, infrastructureSearch, activeTab]);

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

	// Adds a catalog item centered on (centerX, centerY), inside the stage
	const addElement = (item: StageElement, centerX: number, centerY: number) => {
		const x = Math.max(
			0,
			Math.min(centerX - item.width / 2, STAGE_CONFIG.STAGE_WIDTH - item.width)
		);
		const y = Math.max(
			0,
			Math.min(
				centerY - item.height / 2,
				STAGE_CONFIG.STAGE_HEIGHT - item.height
			)
		);

		const newElement: StageElement = {
			...item,
			id: `${item.id}-${Date.now()}`,
			x,
			y,
			isSelected: false,
		};

		const newElements = [...elements, newElement];
		setElements(newElements);
		addToHistory(newElements);
		selectElement(newElement.id);
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		if (!draggedItem || !stageRef.current) return;

		const stageRect = stageRef.current.getBoundingClientRect();
		addElement(
			draggedItem,
			(event.clientX - stageRect.left) / zoom,
			(event.clientY - stageRect.top) / zoom
		);
		setDraggedItem(null);
	};

	// Touch devices have no HTML drag and drop: a tap adds the item to the
	// center of the stage, slightly shifted so repeated taps don't stack
	const handleCatalogItemClick = (item: StageElement) => {
		const offset = (elements.length % 6) * 15;
		addElement(
			item,
			STAGE_CONFIG.STAGE_WIDTH / 2 + offset,
			STAGE_CONFIG.STAGE_HEIGHT / 2 + offset
		);
		setIsCatalogOpen(false);
	};

	const handleElementClick = (event: React.MouseEvent, elementId: string) => {
		event.stopPropagation();
		selectElement(elementId);
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
		return newElements;
	};

	// Resizes keeping the square proportion, between the size limits and
	// without crossing the right/bottom edges of the stage
	const resizeElement = (
		elementId: string,
		getSize: (element: StageElement) => number
	) => {
		const newElements = elements.map((element) => {
			if (element.id !== elementId) return element;

			const maxSize = Math.min(
				STAGE_ELEMENT_SIZE.MAX,
				STAGE_CONFIG.STAGE_WIDTH - element.x,
				STAGE_CONFIG.STAGE_HEIGHT - element.y
			);
			const size = Math.round(
				Math.max(STAGE_ELEMENT_SIZE.MIN, Math.min(maxSize, getSize(element)))
			);
			return { ...element, width: size, height: size };
		});
		setElements(newElements);
		return newElements;
	};

	// Pointer events work for mouse, touch and pen. Moves are measured from
	// where the gesture started; history gets one entry when it ends
	const startPointerGesture = (
		event: React.PointerEvent,
		onMove: (deltaX: number, deltaY: number) => Array<StageElement>
	) => {
		event.preventDefault();
		event.stopPropagation();
		const startX = event.clientX;
		const startY = event.clientY;
		let latestElements: Array<StageElement> | null = null;

		const handlePointerMove = (moveEvent: PointerEvent) => {
			const deltaX = (moveEvent.clientX - startX) / zoom;
			const deltaY = (moveEvent.clientY - startY) / zoom;

			// Ignore tiny moves so a tap only selects
			if (!latestElements && Math.abs(deltaX) <= 2 && Math.abs(deltaY) <= 2) {
				return;
			}
			latestElements = onMove(deltaX, deltaY);
		};

		const handlePointerUp = () => {
			document.removeEventListener("pointermove", handlePointerMove);
			document.removeEventListener("pointerup", handlePointerUp);
			document.removeEventListener("pointercancel", handlePointerUp);
			if (latestElements) addToHistory(latestElements);
		};

		document.addEventListener("pointermove", handlePointerMove);
		document.addEventListener("pointerup", handlePointerUp);
		document.addEventListener("pointercancel", handlePointerUp);
	};

	const handleSave = () => {
		onSave(convertElementsToStageMapData(elements));
		onClose();
	};

	if (!isOpen) return null;

	const renderTabContent = () => {
		switch (activeTab) {
			case "infrastructure":
				return (
					<>
						<div className="p-6">
							{/* Tabs */}
							<div className="mb-6">
								<p className="text-sm text-gray-600 mb-4">
									Arraste a opção para o palco ou toque nela para adicionar
								</p>
							</div>

							{/* Search */}
							<div className="relative mb-6">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input
									type="text"
									placeholder="Buscar itens de palco..."
									value={infrastructureSearch}
									onChange={(event) => {
										setInfrastructureSearch(event.target.value);
									}}
									className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-transparent"
								/>
							</div>

							{/* Infrastructure */}
							<div className="mb-6">
								<div className="grid grid-cols-3 gap-3">
									{loadingInstruments ? (
										<div className="col-span-3 text-center py-4">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-300 mx-auto"></div>
										</div>
									) : filteredInstrumentElements.length > 0 ? (
										filteredInstrumentElements
											.filter((element) => element.idTipoEquipamento === 2)
											.map((element) => (
												<button
													key={element.id}
													draggable
													onDragStart={() => {
														handleDragStart(element);
													}}
													onClick={() => {
														handleCatalogItemClick(element);
													}}
													className="p-3 bg-white hover:bg-primary-50/50 border border-gray-200 hover:border-primary-300 rounded-lg cursor-grab transition-all duration-200 flex flex-col items-center gap-2"
												>
													<div>
														<img
															className="w-10 h-10"
															src={element.icon}
															alt={element.name}
														/>
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
						</div>
					</>
				);

			default:
				return (
					<>
						<div className="p-6">
							{/* Tabs */}
							<div className="mb-6">
								<p className="text-sm text-gray-600 mb-4">
									Arraste o instrumento para o palco ou toque nele para
									adicionar
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
									className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 hover:border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent"
								/>
							</div>

							{/* Instruments */}
							<div className="mb-6">
								<div className="grid grid-cols-3 gap-3">
									{loadingInstruments ? (
										<div className="col-span-3 text-center py-4">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
										</div>
									) : filteredInstrumentElements.length > 0 ? (
										filteredInstrumentElements
											.filter((element) => element.idTipoEquipamento === 1)
											.map((element) => (
												<button
													key={element.id}
													draggable
													onDragStart={() => {
														handleDragStart(element);
													}}
													onClick={() => {
														handleCatalogItemClick(element);
													}}
													className="p-3 bg-white hover:bg-primary-50/75 border border-gray-200 hover:border-primary-300 rounded-lg cursor-grab transition-all duration-200 flex flex-col items-center gap-2"
												>
													<div>
														<img
															className="w-10 h-10"
															src={element.icon}
															alt={element.name}
														/>
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
						</div>
					</>
				);
		}
	};

	const instrumentCount = elements.filter(
		(element) => element.idTipoEquipamento === 1
	).length;
	const infrastructureCount = elements.filter(
		(element) => element.idTipoEquipamento === 2
	).length;

	// Stage controls shrink with the zoom; dividing by it keeps them big
	// enough to hit with a finger (about 24px on screen or more)
	const resizeHandleSize = (isCompact ? 28 : 20) / zoom;
	const deleteIconSize = (isCompact ? 24 : 20) / zoom;

	const handleUndo = () => {
		const undoElements = undo();
		if (undoElements) setElements(undoElements);
	};

	const handleRedo = () => {
		const redoElements = redo();
		if (redoElements) setElements(redoElements);
	};

	const zoomOut = () => {
		setZoom(Math.max(zoom - 0.1, STAGE_CONFIG.MIN_ZOOM));
	};

	const zoomIn = () => {
		setZoom(Math.min(zoom + 0.1, STAGE_CONFIG.MAX_ZOOM));
	};

	const catalog = (
		<>
			<div>
				<TabNavigation
					currentTab={activeTab}
					tabs={secondaryTabs}
					variant="underline"
					onChange={setActiveTab}
				/>
			</div>

			{renderTabContent()}
		</>
	);

	const sizeSlider = selectedElement && (
		<div className="flex flex-1 items-center gap-3">
			<input
				type="range"
				aria-label={`Tamanho de ${selectedElement.name}`}
				min={STAGE_ELEMENT_SIZE.MIN}
				max={STAGE_ELEMENT_SIZE.MAX}
				value={selectedElement.width}
				onChange={(event) => {
					const size = Number(event.target.value);
					resizeElement(selectedElement.id, () => size);
				}}
				onPointerUp={() => {
					addToHistory(elementsRef.current);
				}}
				onKeyUp={() => {
					addToHistory(elementsRef.current);
				}}
				className="flex-1 min-w-0 accent-primary-600"
			/>
			<span className="w-12 text-right text-sm font-medium text-gray-700">
				{selectedElement.width}px
			</span>
		</div>
	);

	const stage = (
		<div
			className={`flex-1 bg-gray-100 overflow-auto ${isCompact ? "p-2" : "p-6"}`}
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
						const isSelected = element.id === selectedElementId;

						return (
							<div
								role="button"
								key={element.id}
								className={`absolute rounded-lg flex flex-col items-center justify-center touch-none select-none transition-colors duration-200 hover:bg-primary-50/75 ${
									isSelected ? "ring-2 ring-primary-400 bg-primary-50/50" : ""
								}`}
								style={{
									left: element.x,
									top: element.y,
									width: element.width,
									height: element.height,
								}}
								onClick={(event) => {
									handleElementClick(event, element.id);
								}}
								onPointerDown={(event) => {
									selectElement(element.id);
									startPointerGesture(event, (deltaX, deltaY) =>
										handleElementDrag(element.id, deltaX, deltaY)
									);
								}}
							>
								<StageElementContent element={element} />

								<button
									type="button"
									aria-label={`Remover ${element.name}`}
									onPointerDown={(event) => {
										event.stopPropagation();
									}}
									onClick={(event) => {
										event.stopPropagation();
										deleteElement(element.id);
									}}
									className="absolute top-0 right-0 text-primary-500"
								>
									<X
										style={{ width: deleteIconSize, height: deleteIconSize }}
									/>
								</button>

								{/* Resize handle: bottom-right corner of the selected item */}
								{isSelected && (
									<span
										aria-hidden="true"
										className="absolute bg-white border-2 border-primary-500 rounded-sm cursor-nwse-resize touch-none"
										style={{
											width: resizeHandleSize,
											height: resizeHandleSize,
											right: -resizeHandleSize / 2,
											bottom: -resizeHandleSize / 2,
										}}
										onClick={(event) => {
											event.stopPropagation();
										}}
										onPointerDown={(event) => {
											startPointerGesture(event, (deltaX, deltaY) =>
												resizeElement(
													element.id,
													(current) => current.width + Math.max(deltaX, deltaY)
												)
											);
										}}
									/>
								)}
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

	// Phones and tablets: full screen, stage first, catalog in a bottom sheet
	if (isCompact) {
		return (
			<div className="fixed inset-0 z-50 bg-white flex flex-col h-[100dvh]">
				{/* Header */}
				<div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
					<button
						type="button"
						aria-label="Fechar"
						onClick={onClose}
						className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
					>
						<X className="w-5 h-5" />
					</button>
					<h2 className="flex-1 text-base font-semibold text-gray-900 truncate">
						Mapa de Palco
					</h2>
					<Button
						size="sm"
						onClick={handleSave}
						className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg"
					>
						<Save className="w-4 h-4" />
						Salvar
					</Button>
				</div>

				{/* Toolbar */}
				<div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-gray-50 overflow-x-auto">
					<button
						type="button"
						aria-label="Desfazer"
						onClick={handleUndo}
						disabled={!canUndo}
						className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
					>
						<Undo className="w-4 h-4" />
					</button>
					<button
						type="button"
						aria-label="Refazer"
						onClick={handleRedo}
						disabled={!canRedo}
						className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-40"
					>
						<Redo className="w-4 h-4" />
					</button>
					<span className="w-px h-5 bg-gray-300 mx-1" />
					<button
						type="button"
						aria-label="Diminuir zoom"
						onClick={zoomOut}
						className="p-2 rounded-lg hover:bg-gray-200"
					>
						<ZoomOut className="w-4 h-4" />
					</button>
					<span className="w-10 text-center text-xs font-medium text-gray-700">
						{Math.round(zoom * 100)}%
					</span>
					<button
						type="button"
						aria-label="Aumentar zoom"
						onClick={zoomIn}
						className="p-2 rounded-lg hover:bg-gray-200"
					>
						<ZoomIn className="w-4 h-4" />
					</button>
					<button
						type="button"
						aria-label="Mostrar grade"
						aria-pressed={showGrid}
						onClick={() => {
							setShowGrid(!showGrid);
						}}
						className={`p-2 rounded-lg ${
							showGrid ? "bg-primary-50 text-primary-500" : "text-gray-400"
						}`}
					>
						<Grid3x3 className="w-4 h-4" />
					</button>
					<span className="ml-auto flex items-center gap-2 pl-2 text-xs text-gray-600 whitespace-nowrap">
						<span>
							Instr.{" "}
							<strong className="text-primary-500">{instrumentCount}</strong>
						</span>
						<span>
							Infra{" "}
							<strong className="text-green-600">{infrastructureCount}</strong>
						</span>
					</span>
				</div>

				{/* The stage is wide (8:5): landscape shows it much bigger */}
				<p className="hidden portrait:flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-gray-600 bg-primary-50">
					<RotateCw className="w-3.5 h-3.5" />
					Gire o celular para ter mais espaço
				</p>

				{stage}

				{/* Selected item: size and delete */}
				{selectedElement && (
					<div className="flex items-center gap-3 px-3 py-2 border-t border-gray-200 bg-white">
						<span className="max-w-24 text-sm font-medium text-gray-700 truncate">
							{selectedElement.name}
						</span>
						{sizeSlider}
						<button
							type="button"
							aria-label={`Remover ${selectedElement.name}`}
							onClick={() => {
								deleteElement(selectedElement.id);
							}}
							className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
						>
							<Trash2 className="w-5 h-5" />
						</button>
					</div>
				)}

				<div className="p-3 border-t border-gray-200">
					<Button
						className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg"
						onClick={() => {
							setIsCatalogOpen(true);
						}}
					>
						<Plus className="w-5 h-5" />
						Adicionar item
					</Button>
				</div>

				{/* Catalog bottom sheet */}
				{isCatalogOpen && (
					<div
						className="absolute inset-0 z-10 flex flex-col justify-end bg-black/40"
						onClick={() => {
							setIsCatalogOpen(false);
						}}
					>
						<div
							role="dialog"
							aria-label="Adicionar item ao palco"
							className="bg-gray-50 rounded-t-2xl max-h-[75%] flex flex-col overflow-hidden"
							onClick={(event) => {
								event.stopPropagation();
							}}
						>
							<div className="flex items-center justify-between px-4 pt-3">
								<span className="font-medium text-gray-900">
									Adicionar ao palco
								</span>
								<button
									type="button"
									aria-label="Fechar lista"
									onClick={() => {
										setIsCatalogOpen(false);
									}}
									className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg"
								>
									<X className="w-5 h-5" />
								</button>
							</div>
							<div className="overflow-y-auto">{catalog}</div>
						</div>
					</div>
				)}
			</div>
		);
	}

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
						<div className="p-2 bg-primary-600 rounded-lg">
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
						{catalog}
					</div>

					{/* Center - Stage Area */}
					{stage}

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
												onClick={zoomOut}
												className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
											>
												<ZoomOut className="w-4 h-4" />
											</button>
											<span className="w-14 text-center text-sm font-medium">
												{Math.round(zoom * 100)}%
											</span>
											<button
												onClick={zoomIn}
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
													? "bg-primary-50 text-primary-500"
													: "bg-gray-200 text-gray-400 hover:bg-gray-300"
											}`}
										>
											<Grid3x3 className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>

							{/* Selected item size */}
							{selectedElement && (
								<div>
									<h4 className="text-sm font-medium text-gray-700 mb-4">
										Tamanho: {selectedElement.name}
									</h4>
									{sizeSlider}
								</div>
							)}

							{/* Actions */}
							<div>
								<h4 className="text-sm font-medium text-gray-700 mb-4">
									Ações
								</h4>
								<div className="flex gap-2">
									<button
										onClick={handleUndo}
										disabled={!canUndo}
										className="flex-1 p-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
									>
										<Undo className="w-4 h-4" />
										<span className="text-sm">Desfazer</span>
									</button>
									<button
										onClick={handleRedo}
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
									<div className="flex justify-between items-center p-3 bg-primary-50/50 border border-primary-50 rounded-lg">
										<span className="text-sm text-gray-700">Instrumentos</span>
										<span className="text-lg font-bold text-primary-500">
											{instrumentCount}
										</span>
									</div>
									<div className="flex justify-between items-center p-3 bg-green-50 border border-gray-200 rounded-lg">
										<span className="text-sm text-gray-700">
											Infraestrutura
										</span>
										<span className="text-lg font-bold text-green-600">
											{infrastructureCount}
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
							? "Arraste o canto para redimensionar • Delete para remover • Ctrl+C para duplicar"
							: "Arraste ou toque nos itens da lista para adicioná-los ao palco"}
					</div>

					<div className="flex gap-3">
						<Button
							variant="secondary"
							onClick={onClose}
							className="px-6 py-2.5 font-medium rounded-lg transition-all duration-200"
						>
							Cancelar
						</Button>
						<Button
							onClick={handleSave}
							className="px-6 py-2.5 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2"
						>
							<Save className="w-4 h-4" />
							Salvar Mapa
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

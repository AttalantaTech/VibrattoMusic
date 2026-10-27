// Core stage element interface
export interface StageElement {
	id: string;
	name: string;
	x: number;
	y: number;
	icon: string;
	category: "instrument" | "infrastructure" | "equipment";
	color: string;
	instrumentId?: number;
	instrumentName?: string; // For display purposes
	idTipoEquipamento?: number;
	isSelected?: boolean;
	width: number;
	height: number;
	rotation?: number;
	locked?: boolean;
}

// Stage map data for API communication
export interface StageMapData {
	idInstrumento: number;
	posicaoX: number;
	posicaoY: number;
	// Side of the (square) element in px; null for maps saved before resizing existed
	tamanho?: number | null;
}

// History state for undo/redo functionality
export interface HistoryState {
	elements: Array<StageElement>;
	timestamp: number;
}

// Instrument data from API (matches FilterOption)
export interface InstrumentData {
	Id: number;
	Nome: string;
}

// Stage Map Builder component props
export interface StageMapBuilderProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (stageMap: Array<StageMapData>) => void;
	initialElements?: Array<StageElement>;
}

// Infrastructure elements structure
export interface InfrastructureElements {
	vias: Array<StageElement>;
	retornos: Array<StageElement>;
	extras: Array<StageElement>;
}

// Hook return types for better type safety
export interface UseStageHistoryReturn {
	addToHistory: (elements: Array<StageElement>) => void;
	undo: () => Array<StageElement> | null;
	redo: () => Array<StageElement> | null;
	canUndo: boolean;
	canRedo: boolean;
}

export interface UseStageInteractionsReturn {
	selectedElementId: string | null;
	draggedItem: StageElement | null;
	setDraggedItem: (item: StageElement | null) => void;
	deleteElement: (id: string) => void;
	duplicateElement: (id: string) => void;
	selectElement: (id: string | null) => void;
}

// Constants for stage configuration
export const STAGE_COLORS = {
	instrument: "#2563eb", // Blue (consistent with platform)
	infrastructure: "#059669", // Emerald
	equipment: "#7c3aed", // Violet
} as const;

export const STAGE_CONFIG = {
	MIN_ZOOM: 0.3,
	MAX_ZOOM: 3,
	STAGE_WIDTH: 800,
	STAGE_HEIGHT: 500,
	HISTORY_LIMIT: 50,
} as const;

// Element size limits in px (elements keep a square proportion)
export const STAGE_ELEMENT_SIZE = {
	DEFAULT: 80,
	MIN: 50,
	MAX: 200,
} as const;

// Type for stage colors
export type StageColorType = keyof typeof STAGE_COLORS;

// Type for stage categories
export type StageCategoryType = "instrument" | "infrastructure" | "equipment";

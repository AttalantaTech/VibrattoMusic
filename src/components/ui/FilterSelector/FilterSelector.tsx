import { useState, useRef, useEffect } from "react";

interface Filter {
	id: string;
	label: string;
}

interface FilterSelectorProps {
	title?: string;
	filters: Array<Filter>;
	selectedFilters: Array<string>;
	onFilterChange: (selectedIds: Array<string>) => void;
}

export const FilterSelector = ({
	title = "Filtros",
	filters,
	selectedFilters,
	onFilterChange,
}: FilterSelectorProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const toggleFilter = (filterId: string) => {
		const newSelectedFilters = selectedFilters.includes(filterId)
			? selectedFilters.filter((id) => id !== filterId)
			: [...selectedFilters, filterId];

		onFilterChange(newSelectedFilters);
	};

	const removeFilter = (filterId: string) => {
		onFilterChange(selectedFilters.filter((id) => id !== filterId));
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			{selectedFilters.map((filterId) => {
				const filter = filters.find((f) => f.id === filterId);
				if (!filter) return null;

				return (
					<div
						key={filterId}
						className="flex items-center bg-white rounded-lg border border-gray-300 px-3 py-1"
					>
						<span>{filter.label}</span>
						<button
							className="ml-2 text-gray-700 hover:text-gray-700"
							onClick={() => {
								removeFilter(filterId);
							}}
						>
							×
						</button>
					</div>
				);
			})}

			{/* Dropdown de filtros */}
			<div ref={dropdownRef} className="relative">
				<button
					className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg px-3 py-1 text-gray-700 hover:bg-gray-50"
					onClick={() => {
						setIsOpen(!isOpen);
					}}
				>
					{title}
					<svg
						className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M19 9l-7 7-7-7"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
						/>
					</svg>
				</button>

				{isOpen && (
					<div className="absolute z-10 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1">
						<div className="px-4 py-2 text-xs text-gray-500 border-b">
							{title}
						</div>
						<div className="max-h-60 overflow-y-auto">
							{filters.map((filter) => (
								<label
									key={filter.id}
									className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
								>
									<input
										checked={selectedFilters.includes(filter.id)}
										className="rounded text-primary-600 mr-2"
										type="checkbox"
										onChange={() => {
											toggleFilter(filter.id);
										}}
									/>
									<span>{filter.label}</span>
								</label>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

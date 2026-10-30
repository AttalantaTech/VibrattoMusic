import clsx from "clsx";
import { ChevronDown, Loader, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SEARCH_MIN_OPTIONS } from "@/components/forms/Select/Select";

type Option = {
	label: string;
	value: string;
};

interface DropdownSelectProps {
	icon?: React.ReactNode;
	id: string;
	options: Array<Option>;
	label?: string;
	className?: string;
	selectedOption: Option | null;
	setSelectedOption: (options: Option | null) => void;
	onReachEnd?: () => void;
	searchTerm?: string;
	setSearchTerm?: (value: string) => void;
	isLoading?: boolean;
}

export const DropdownSelect = ({
	id,
	label,
	icon,
	options,
	className,
	selectedOption,
	setSelectedOption,
	onReachEnd,
	searchTerm: externalSearchTerm,
	setSearchTerm: externalSetSearchTerm,
	isLoading,
}: DropdownSelectProps) => {
	const [isOpen, setIsOpen] = useState(false);

	// Same rule as the form Select: cities search on the server, the other
	// long lists (categories, genres, event types) filter here
	const isServerSearch = !!externalSetSearchTerm;
	const [localSearchTerm, setLocalSearchTerm] = useState("");
	const searchTerm = isServerSearch
		? (externalSearchTerm ?? "")
		: localSearchTerm;
	const setSearchTerm = isServerSearch
		? externalSetSearchTerm
		: setLocalSearchTerm;
	const showSearch = isServerSearch || options.length >= SEARCH_MIN_OPTIONS;
	const visibleOptions = isServerSearch
		? options
		: options.filter((option) =>
				option.label.toLowerCase().includes(searchTerm.toLowerCase())
			);

	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLLIElement>(null);
	const onReachEndRef = useRef(onReachEnd);

	const current =
		options.find((o) => o.value === selectedOption?.value)?.label ||
		label ||
		"Selecionar";

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setSearchTerm("");
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, setSearchTerm]);

	useEffect(() => {
		onReachEndRef.current = onReachEnd;
	}, [onReachEnd]);

	useEffect(() => {
		if (!isOpen) return;

		const root = dropdownRef.current;
		const target = sentinelRef.current;

		if (!root || !target) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					onReachEndRef.current?.();
				}
			},
			{
				root,
				threshold: 0.1,
			}
		);

		observer.observe(target);

		return () => {
			observer.disconnect();
		};
	}, [isOpen]);

	return (
		<div className={clsx("relative", className)} ref={containerRef}>
			{/* Same behavior as the form Select: the choice shows its name with an
			    x to clear it (it was a "Remover seleção" row inside the list) */}
			<div className="flex items-center">
				<button
					type="button"
					className="flex items-center gap-1 px-2 py-1 text-sm text-black hover:text-primary-600"
					onClick={() => {
						setIsOpen(!isOpen);
						setSearchTerm("");
					}}
				>
					{icon}
					<span className="font-normal text-base text-gray-900">{current}</span>
					<ChevronDown
						className={`ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
						size={16}
					/>
				</button>
				{selectedOption ? (
					<button
						type="button"
						aria-label="Limpar seleção"
						className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
						onClick={() => {
							setSelectedOption(null);
							setIsOpen(false);
							setSearchTerm("");
						}}
					>
						<X size={14} />
					</button>
				) : null}
			</div>

			{isOpen && (
				<div
					ref={dropdownRef}
					className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
					onClick={(event) => {
						event.stopPropagation();
					}}
				>
					{/* Search */}
					{showSearch && (
						<div className="border-b border-gray-200 p-2">
							<div className="relative">
								<Search
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								/>

								<input
									id={`${id}-dropdown-select`}
									name={`${id}-dropdown-select`}
									type="text"
									value={searchTerm}
									onChange={(event) => {
										setSearchTerm(event.target.value);
									}}
									placeholder="Pesquisar..."
									// Opening goes straight to typing
									autoFocus
									className=" h-9 w-full rounded-md
								border border-gray-300
								bg-white
								py-2 pl-9 pr-3
								text-sm text-gray-900
								placeholder:text-gray-400
								outline-none
								transition
								focus:border-primary-500
								focus:ring-1
								focus:ring-primary-500"
									onClick={(event) => {
										event.stopPropagation();
									}}
								/>
							</div>
						</div>
					)}

					{/* Options */}
					<ul className="max-h-60 overflow-y-auto py-1">
						{visibleOptions.map((option, index) => (
							<li key={index}>
								<button
									type="button"
									className={clsx(
										"w-full text-left px-4 py-2 hover:bg-gray-100",
										option.value === selectedOption?.value &&
											"bg-primary-50 text-primary-900"
									)}
									onClick={() => {
										setSelectedOption(option);
										setIsOpen(false);
										setSearchTerm("");
									}}
								>
									{option.label}
								</button>
							</li>
						))}
						<li
							ref={sentinelRef}
							className={`${isLoading ? "h-10" : ""} flex justify-center items-center`}
						>
							{isLoading && (
								<Loader size={16} className="animate-spin text-primary-500" />
							)}
						</li>
					</ul>
				</div>
			)}
		</div>
	);
};

import clsx from "clsx";
import { ChevronDown, Loader, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Option = {
	label: string;
	value: string;
};

interface DropdownSelectProps {
	icon?: React.ReactNode;
	id: string;
	options: Array<Option>;
	selected: string;
	label?: string;
	className?: string;
	onChange: (value: string) => void;
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
	selected,
	className,
	onChange,
	onReachEnd,
	searchTerm = "",
	setSearchTerm,
	isLoading,
}: DropdownSelectProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLLIElement>(null);
	const onReachEndRef = useRef(onReachEnd);

	const current =
		options.find((o) => o.value === selected)?.label || label || "Selecionar";

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(!isOpen);
				setSearchTerm?.("");
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
			<button
				className="flex items-center gap-1 px-2 py-1 text-sm text-black hover:text-primary-600"
				onClick={() => {
					setIsOpen(!isOpen);
				}}
			>
				{icon}
				<span className="font-normal text-base text-gray-900">{current}</span>
				<ChevronDown className="ml-1" size={16} />
			</button>

			{isOpen && (
				<div
					ref={dropdownRef}
					className="absolute left-0 top-full z-50 mt-1 w-full min-w-[220px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
					onClick={(event) => {
						event.stopPropagation();
					}}
				>
					{/* Search */}
					{setSearchTerm && (
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
						{options.map((option, index) => (
							<li key={index}>
								<button
									className="w-full text-left px-4 py-2 hover:bg-gray-100"
									onClick={() => {
										onChange(option.value);
										setIsOpen(false);
									}}
								>
									{option.label}
								</button>
							</li>
						))}
						{selected && (
							<li>
								<button
									className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 border-t border-gray-200"
									onClick={() => {
										onChange("");
										setIsOpen(!isOpen);
										setSearchTerm?.("");
									}}
								>
									Remover seleção
								</button>
							</li>
						)}

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

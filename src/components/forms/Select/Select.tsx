import { useState, useEffect, useRef } from "react";
import { cn } from "../../../lib/utils/cn";
import type { FunctionComponent } from "../../../common/types";
import { ChevronDown, X } from "lucide-react";

export type Option = {
	value: string;
	label: string;
};

type SelectProps = {
	label: string;
	name: string;
	placeholder?: string;
	options: Array<Option>;
	selectedOptions: Array<Option>;
	setSelectedOptions: (options: Array<Option>) => void;
	className?: string;
};

export const Select = ({
	label,
	name,
	placeholder = "Selecionar...",
	options,
	selectedOptions,
	setSelectedOptions,
	className,
}: SelectProps): FunctionComponent => {
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

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const toggleOption = (option: Option) => {
		const isSelected = selectedOptions.some((o) => o.value === option.value);
		if (isSelected) {
			setSelectedOptions(
				selectedOptions.filter((o) => o.value !== option.value)
			);
		} else {
			setSelectedOptions([...selectedOptions, option]);
		}
	};

	const onRemove = (value: string) => {
		setSelectedOptions(selectedOptions.filter((o) => o.value !== value));
	};

	const handleSelect = (option: Option) => {
		toggleOption(option);
	};

	return (
		<div className="flex flex-col gap-2 w-full">
			<label className="text-sm font-medium text-gray-700" htmlFor={name}>
				{label}
			</label>

			{/* Input com dropdown */}
			<div className="relative" ref={dropdownRef}>
				<div
					id={name}
					className={cn(
						"w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer flex items-center justify-between",
						className
					)}
					onClick={toggleDropdown}
				>
					<span
						className={
							selectedOptions.length > 0 ? "text-gray-900" : "text-gray-400"
						}
					>
						{selectedOptions.length > 0
							? `${selectedOptions.length} selecionados`
							: placeholder}
					</span>
					<ChevronDown
						className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
						size={16}
					/>
				</div>

				{/* Dropdown */}
				{isOpen && (
					<div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto">
						<ul className="py-1">
							{options.map((option) => (
								<li
									key={option.value}
									className="px-4 py-2 text-sm text-gray-900 hover:bg-blue-50 cursor-pointer flex items-center gap-2"
									onClick={(e) => {
										e.stopPropagation();
										handleSelect(option);
									}}
								>
									<input
										readOnly
										className="text-blue-500"
										size={16}
										type="checkbox"
										checked={selectedOptions.some(
											(o) => o.value === option.value
										)}
									/>
									{option.label}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>

			{selectedOptions.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-2">
					{selectedOptions.map((option) => (
						<div
							key={option.value}
							className="flex items-center justify-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
						>
							<button
								className="rounded-full hover:bg-blue-200 focus:outline-none"
								type="button"
								onClick={() => {
									onRemove(option.value);
								}}
							>
								<X size={10} />
							</button>
							<span>{option.label}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

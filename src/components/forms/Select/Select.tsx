import { useState, useEffect, useRef } from "react";
import { cn } from "../../../lib/utils/cn";
import type { FunctionComponent } from "../../../common/types";
import { ChevronDown, Search, X } from "lucide-react";

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
	multiple?: boolean;
	disabled?: boolean;
};

const ALL_OPTION: Option = {
	value: "__ALL__",
	label: "Todos",
};

export const Select = ({
	label,
	name,
	placeholder = "Selecionar...",
	options,
	selectedOptions,
	setSelectedOptions,
	className,
	multiple,
	disabled = false,
}: SelectProps): FunctionComponent => {
	const [searchTerm, setSearchTerm] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const filteredOptions = options.filter((option) =>
		option.label.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const computedOptions = multiple
		? [ALL_OPTION, ...filteredOptions]
		: filteredOptions;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
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
	}, [isOpen]);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
		setSearchTerm("");
	};

	const toggleOption = (option: Option) => {
		const isAll = option.value === ALL_OPTION.value;

		if (multiple) {
			if (isAll) {
				const isAllSelected = selectedOptions.length === filteredOptions.length;

				if (isAllSelected) {
					setSelectedOptions([]);
				} else {
					setSelectedOptions(filteredOptions);
				}
				return;
			}

			const isSelected = selectedOptions.some((o) => o.value === option.value);

			let newSelected: Array<Option>;

			if (isSelected) {
				newSelected = selectedOptions.filter((o) => o.value !== option.value);
			} else {
				newSelected = [...selectedOptions, option];
			}

			setSelectedOptions(newSelected);
		} else {
			setSelectedOptions([option]);
			setIsOpen(false);
		}
	};

	const onRemove = (value: string) => {
		setSelectedOptions(selectedOptions.filter((o) => o.value !== value));
	};

	const handleSelect = (option: Option) => {
		toggleOption(option);
	};

	const handleSelectOptionsText = (): string => {
		if (selectedOptions.length === 0) return placeholder;

		if (multiple) {
			if (selectedOptions.length === filteredOptions.length) {
				return "Todos selecionados";
			}

			if (selectedOptions.length === 1) {
				return `${selectedOptions.length} selecionado`;
			}

			return `${selectedOptions.length} selecionados`;
		}

		return `${selectedOptions.length} selecionado`;
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
						`w-full bg-white rounded-md border border-gray-300 px-4 py-2 text-sm 
						text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 
						focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer flex 
						items-center justify-between
						${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
						`,
						className
					)}
					onClick={() => {
						if (!disabled) {
							toggleDropdown();
						}
					}}
				>
					<span
						className={
							selectedOptions.length > 0 ? "text-gray-900" : "text-gray-400"
						}
					>
						{handleSelectOptionsText()}
					</span>
					<ChevronDown
						className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
						size={16}
					/>
				</div>

				{/* Dropdown */}
				{isOpen && (
					<div
						className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto"
						onClick={(event) => {
							event.stopPropagation();
						}}
					>
						<div className="p-2 border-b border-gray-200">
							<div className="relative">
								<Search
									size={16}
									className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
								/>

								<input
									type="text"
									value={searchTerm}
									onChange={(event) => {
										setSearchTerm(event.target.value);
									}}
									placeholder="Pesquisar..."
									className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm
                    text-gray-900 placeholder-gray-400 focus:border-primary-500
                    focus:outline-none focus:ring-1 focus:ring-primary-500"
									onClick={(event) => {
										event.stopPropagation();
									}}
								/>
							</div>
						</div>
						<ul className="py-1">
							{computedOptions.map((option) => {
								const isAll = option.value === ALL_OPTION.value;

								return (
									<li
										key={option.value}
										className="px-4 py-2 text-sm text-gray-900 hover:bg-primary-50 cursor-pointer flex items-center gap-2"
										onClick={(event) => {
											event.stopPropagation();
											handleSelect(option);
										}}
									>
										<input
											readOnly
											type={multiple ? "checkbox" : "radio"}
											checked={
												isAll
													? selectedOptions.length === filteredOptions.length
													: selectedOptions.some(
															(o) => o.value === option.value
														)
											}
										/>
										{option.label}
									</li>
								);
							})}
						</ul>
					</div>
				)}
			</div>

			{selectedOptions.length > 0 && (
				<div className="mt-2 flex flex-wrap gap-2">
					{selectedOptions
						.filter((option) => option.label !== "Todos")
						.map((option) => (
							<div
								key={option.value}
								className="flex items-center justify-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700"
							>
								<button
									className="rounded-full hover:bg-primary-200 focus:outline-none"
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

import { cn } from "../../../lib/utils/cn";
import type { FunctionComponent } from "../../../common/types";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type React from "react";

export type Option = {
	value: string;
	label: string;
};

type SingleSelectProps = {
	label?: string;
	name?: string;
	placeholder?: string;
	options: Array<Option>;
	value?: string;
	onChange: (value: string | undefined) => void;
	className?: string;
	icon?: React.ReactNode;
};

export const SingleSelect = ({
	label,
	name,
	placeholder = "Selecionar...",
	options,
	value,
	onChange,
	className,
	icon,
}: SingleSelectProps): FunctionComponent => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const handleSelect = (option: Option) => {
		onChange(option.value);
		setIsOpen(false);
	};

	const handleClear = () => {
		onChange(undefined);
		setIsOpen(false);
	};

	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<div className="flex flex-col gap-2 w-full">
			{label && (
				<label className="text-sm font-medium text-gray-700" htmlFor={name}>
					{label}
				</label>
			)}

			{/* Input with dropdown */}
			<div className="relative">
				<div
					id={name}
					className={cn(
						"w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer flex items-center justify-between",
						icon && "pl-10",
						className
					)}
					onClick={toggleDropdown}
				>
					{icon && (
						<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
							{icon}
						</div>
					)}
					<span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
						{selectedOption ? selectedOption.label : placeholder}
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
							{placeholder && (
								<li
									className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
									onClick={handleClear}
								>
									{placeholder}
								</li>
							)}
							{options.map((option) => (
								<li
									key={option.value}
									className={cn(
										"px-4 py-2 text-sm cursor-pointer",
										option.value === value
											? "bg-blue-50 text-blue-900"
											: "text-gray-900 hover:bg-gray-50"
									)}
									onClick={() => {
										handleSelect(option);
									}}
								>
									{option.label}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
};

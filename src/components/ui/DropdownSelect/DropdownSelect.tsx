import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef } from "react";

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
	openDropdown: string | null;
	onChange: (value: string) => void;
	setOpenDropdown: (id: string | null) => void;
}

export const DropdownSelect = ({
	id,
	label,
	icon,
	options,
	selected,
	className,
	openDropdown,
	onChange,
	setOpenDropdown,
}: DropdownSelectProps) => {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const open = openDropdown === id;

	const current =
		options.find((o) => o.value === selected)?.label || label || "Selecionar";

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				open
			) {
				setOpenDropdown(null);
			}
		};

		if (open) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [open, setOpenDropdown]);

	return (
		<div className={clsx("relative", className)} ref={dropdownRef}>
			<button
				className="flex items-center gap-1 px-2 py-1 text-sm text-black hover:text-primary-600"
				onClick={() => {
					setOpenDropdown(open ? null : id);
				}}
			>
				{icon}
				<span className="font-normal text-base text-gray-900">{current}</span>
				<ChevronDown className="ml-1" size={16} />
			</button>{" "}
			{open && (
				<ul className="absolute mt-2 z-10 bg-white border rounded shadow w-48">
					{options.map((option, index) => (
						<li key={index}>
							<button
								className="w-full text-left px-4 py-2 hover:bg-gray-100"
								onClick={() => {
									onChange(option.value);
									setOpenDropdown(null);
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
									setOpenDropdown(null);
								}}
							>
								Remover seleção
							</button>
						</li>
					)}
				</ul>
			)}
		</div>
	);
};

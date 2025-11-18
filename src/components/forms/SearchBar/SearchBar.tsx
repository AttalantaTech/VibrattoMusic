import type React from "react";
import { Search } from "lucide-react";
import clsx from "clsx";

interface SearchBarProps {
	placeholder?: string;
	value?: string;
	onChange?: (value: string) => void;
	className?: string;
	icon?: React.ReactNode;
}

export const SearchBar = ({
	className,
	icon,
	onChange,
	placeholder,
	value,
}: SearchBarProps) => {
	return (
		<div
			className={clsx(
				"flex items-center w-full rounded-lg border border-gray-300 bg-white shadow-sm overflow-hidden",
				className
			)}
		>
			<div className="px-3 py-2 bg-gray-100 text-blue-600">
				{icon || <Search className="w-5 h-5" />}
			</div>
			<input
				className="flex-1 px-3 py-2 text-gray-500 text-base outline-none bg-transparent"
				placeholder={placeholder}
				type="text"
				value={value}
				onChange={(event) => onChange?.(event.target.value)}
			/>
		</div>
	);
};

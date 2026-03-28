import type { ReactNode } from "react";

interface IconInputProps {
	icon: ReactNode;
	value: string;
	onChange?: (value: string) => void;
	name: string;
	placeholder?: string;
	type?: string;
	className?: string;
}

export function IconInput({
	icon,
	value,
	placeholder = "",
	name,
	onChange,
	type = "text",
	className = "",
}: IconInputProps) {
	return (
		<div
			className={`flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-primary-500 ${className}`}
		>
			<div className="px-3 py-2 bg-gray-100 text-gray-500">{icon}</div>
			<input
				className="flex-1 px-3 py-2 outline-none"
				name={name}
				placeholder={placeholder}
				type={type}
				value={value}
				onChange={
					onChange
						? (event) => {
								onChange(event.target.value);
							}
						: undefined
				}
			/>
		</div>
	);
}

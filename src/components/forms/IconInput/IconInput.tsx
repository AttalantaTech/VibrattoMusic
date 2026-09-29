import type { InputHTMLAttributes, ReactNode } from "react";

interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
	icon: ReactNode;
	initialText?: string;
	finalText?: string;
	name: string;
	type?: string;
	className?: string;
}

export function IconInput({
	icon,
	value,
	placeholder = "",
	name,
	onChange,
	initialText,
	finalText,
	type = "text",
	className = "",
}: IconInputProps) {
	return (
		<div
			className={`flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-primary-500 ${className}`}
		>
			<div className="px-3 py-2 bg-gray-100">{icon}</div>

			<div className="flex overflow-x-auto justify-between w-full">
				{initialText && (
					<div className="px-3 py-2 bg-gray-100 text-gray-500">
						{initialText}
					</div>
				)}
				<input
					className="flex-1 px-3 py-2 outline-none"
					name={name}
					placeholder={placeholder}
					type={type}
					value={value}
					onChange={
						onChange
							? (event) => {
									onChange(event);
								}
							: undefined
					}
				/>
				{finalText && (
					<div className="px-3 py-2 bg-gray-100 text-gray-500">{finalText}</div>
				)}
			</div>
		</div>
	);
}

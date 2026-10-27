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
	...inputProps
}: IconInputProps) {
	// Phones: "https://" is dropped from the prefix and the prefix can shrink;
	// at full length it left ~15px to type the username
	const shortInitialText = initialText?.replace(/^https?:\/\//, "");

	return (
		<div
			className={`flex items-center border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-primary-500 ${className}`}
		>
			<div className="px-3 py-2 bg-gray-100 shrink-0">{icon}</div>

			<div className="flex min-w-0 justify-between w-full">
				{initialText && (
					<div
						className={`min-w-0 max-w-[55%] sm:max-w-none truncate px-2 sm:px-3 py-2 bg-gray-100 text-gray-500 ${shortInitialText ? "" : "hidden sm:block"}`}
					>
						<span className="hidden sm:inline">{initialText}</span>
						<span className="sm:hidden">{shortInitialText}</span>
					</div>
				)}
				<input
					{...inputProps}
					className="w-0 min-w-[6rem] flex-1 px-3 py-2 outline-none"
					name={name}
					placeholder={placeholder}
					type={type}
					value={value}
					onChange={onChange}
				/>
				{finalText && (
					<div className="shrink-0 px-2 sm:px-3 py-2 bg-gray-100 text-gray-500">
						{finalText}
					</div>
				)}
			</div>
		</div>
	);
}

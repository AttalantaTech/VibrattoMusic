import React from "react";
import { cn } from "../../../lib/utils/cn";
import type { FunctionComponent } from "../../../common/types";

type TextAreaFieldProps = {
	label?: string;
	name: string;
	placeholder?: string;
	helperText?: string;
	className?: string;
	icon?: React.ReactNode;
	rows?: number; // Número de linhas (altura)
	maxLength?: number; // Máximo de caracteres
	showCharCount?: boolean; // Mostrar contador de caracteres
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextAreaField = React.forwardRef<
	HTMLTextAreaElement,
	TextAreaFieldProps
>(
	(
		{
			label,
			helperText,
			name,
			placeholder,
			className,
			required,
			icon,
			rows = 4,
			maxLength,
			showCharCount = true,
			...props
		},
		ref
	): FunctionComponent => {
		const [charCount, setCharCount] = React.useState(0);

		const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
			if (maxLength && event.target.value.length > maxLength) return;
			setCharCount(event.target.value.length);
			props.onChange?.(event);
		};

		return (
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center">
					<label className="text-sm font-medium text-gray-700" htmlFor={name}>
						{label} {required && <span className="text-red-500">*</span>}
					</label>
					{maxLength && showCharCount && (
						<span className="text-xs text-gray-500">
							{charCount}/{maxLength}
						</span>
					)}
				</div>

				<div className="relative">
					{icon && (
						<div className="absolute top-3 left-3 text-gray-500">{icon}</div>
					)}
					<textarea
						ref={ref}
						id={name}
						maxLength={maxLength}
						name={name}
						placeholder={placeholder}
						rows={rows}
						className={cn(
							"w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-50 resize-y min-h-[100px]",
							{
								"pl-10": icon,
							},
							className
						)}
						onChange={handleChange}
						{...props}
					/>
				</div>

				{helperText && <p className="text-xs text-gray-500">{helperText}</p>}
			</div>
		);
	}
);

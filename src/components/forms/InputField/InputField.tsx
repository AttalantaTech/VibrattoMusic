import React from "react";
import { cn } from "../../../lib/utils/cn";
import type { FunctionComponent } from "../../../common/types";
import InputMask from "react-input-mask";

type InputFieldProps = {
	label?: string;
	name?: string;
	placeholder?: string;
	helperText?: string;
	type?: React.HTMLInputTypeAttribute;
	className?: string;
	icon?: React.ReactNode;
	mask?: string;
	maskPlaceholder?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
	(
		{
			label,
			helperText,
			name,
			placeholder,
			type = "text",
			className,
			required,
			icon,
			mask,
			maskPlaceholder,
			...props
		},
		ref
	): FunctionComponent => {
		return (
			<div className="flex flex-col gap-2">
				{label && (
					<label className="text-sm font-medium text-gray-700" htmlFor={name}>
						{label} {required && <span className="text-red-500">*</span>}
					</label>
				)}
				<div className="relative">
					{icon && (
						<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
							{icon}
						</div>
					)}{" "}
					{mask ? (
						<InputMask
							mask={mask}
							maskPlaceholder={maskPlaceholder}
							alwaysShowMask={false}
							{...props}
						>
							<input
								ref={ref}
								id={name}
								name={name}
								placeholder={placeholder}
								type={type}
								className={cn(
									"w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
									{
										"pl-10": icon,
									},
									className
								)}
							/>
						</InputMask>
					) : (
						<input
							ref={ref}
							id={name}
							name={name}
							placeholder={placeholder}
							type={type}
							className={cn(
								"w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
								{
									"pl-10": icon,
								},
								className
							)}
							{...props}
						/>
					)}
				</div>
				{helperText && <p className="text-sm text-gray-500">{helperText}</p>}
			</div>
		);
	}
);

InputField.displayName = "InputField";

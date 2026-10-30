import React from "react";
import { HelpCircle } from "lucide-react";
import { TooltipCustom } from "@/components/ui/TooltipCustom/TooltipCustom";
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
	/** Help shown in a (?) next to the label */
	labelTooltip?: string;
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
			labelTooltip,
			onChange,
			...props
		},
		ref
	): FunctionComponent => {
		const [typedCount, setTypedCount] = React.useState(0);
		// A controlled field counts its value: the typed-only count started at
		// 0 on a field that already had text (editing a profile)
		const charCount =
			props.value !== undefined ? String(props.value).length : typedCount;
		const isOverLimit = !!maxLength && charCount > maxLength;

		const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
			const length = event.target.value.length;
			// Blocks only growing past the limit: a text saved before the limit
			// existed can still be shortened
			if (maxLength && length > maxLength && length >= charCount) return;

			setTypedCount(length);
			onChange?.(event);
		};

		return (
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center">
					<label
						className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
						htmlFor={name}
					>
						{label} {required && <span className="text-red-500">*</span>}
						{labelTooltip ? (
							<TooltipCustom
								trigger={<HelpCircle className="h-4 w-4 text-gray-400" />}
								content={labelTooltip}
							/>
						) : null}
					</label>
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

				{helperText || (maxLength && showCharCount) ? (
					<div className="flex items-start justify-between gap-3">
						{helperText ? (
							<p className="text-xs text-gray-500">{helperText}</p>
						) : (
							<span />
						)}
						{maxLength && showCharCount ? (
							<span
								className={cn(
									"shrink-0 text-xs",
									isOverLimit ? "font-medium text-red-600" : "text-gray-500"
								)}
								aria-live="polite"
							>
								{charCount}/{maxLength}
							</span>
						) : null}
					</div>
				) : null}
			</div>
		);
	}
);

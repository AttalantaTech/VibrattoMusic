import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { format, isValid, parse, parseISO } from "date-fns";
import { Input } from "@/components/ui/Input/Input";
import { cn } from "@/lib/utils/cn";

interface DateInputProps {
	id?: string;
	/** "yyyy-MM-dd" (what the forms and the API use); "" when empty */
	value: string;
	/** Gets "yyyy-MM-dd", or "" while the typed date is incomplete/invalid */
	onChange: (value: string) => void;
	onBlur?: () => void;
	disabled?: boolean;
	className?: string;
}

const toDisplay = (iso: string) => {
	const date = iso ? parseISO(iso.slice(0, 10)) : null;
	return date && isValid(date) ? format(date, "dd/MM/yyyy") : "";
};

const toIso = (display: string) => {
	if (display.length !== 10) return "";
	const date = parse(display, "dd/MM/yyyy", new Date());
	return isValid(date) ? format(date, "yyyy-MM-dd") : "";
};

// 01022026 -> 01/02/2026 while typing
const mask = (text: string) => {
	const digits = text.replace(/\D/g, "").slice(0, 8);
	return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
		.filter(Boolean)
		.join("/");
};

/**
 * Date field always shown as dd/mm/aaaa. The browser's <input type="date">
 * follows the browser language, so an English Chrome showed mm/dd/yyyy. The
 * calendar button still opens the native picker.
 */
export const DateInput = ({
	id,
	value,
	onChange,
	onBlur,
	disabled = false,
	className,
}: DateInputProps) => {
	const [text, setText] = useState(() => toDisplay(value));
	const pickerRef = useRef<HTMLInputElement>(null);

	// Follows changes from outside (form reset, calendar) without wiping a
	// date that is still being typed (its value is "" until complete)
	useEffect(() => {
		setText((current) =>
			toIso(current) === value ? current : toDisplay(value)
		);
	}, [value]);

	const openPicker = () => {
		const picker = pickerRef.current;
		if (!picker) return;
		try {
			picker.showPicker();
		} catch {
			picker.focus();
		}
	};

	return (
		<div className="relative">
			<Input
				id={id}
				type="text"
				inputMode="numeric"
				autoComplete="off"
				placeholder="dd/mm/aaaa"
				maxLength={10}
				value={text}
				disabled={disabled}
				onBlur={onBlur}
				onChange={(event) => {
					const masked = mask(event.target.value);
					setText(masked);
					onChange(toIso(masked));
				}}
				className={cn(!disabled && "pr-10", className)}
			/>

			{disabled ? null : (
				<>
					<button
						type="button"
						aria-label="Abrir calendário"
						onClick={openPicker}
						className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
					>
						<CalendarDays size={18} />
					</button>
					{/* Native picker behind the button; only its popup is used */}
					<input
						ref={pickerRef}
						type="date"
						tabIndex={-1}
						aria-hidden="true"
						value={value}
						onChange={(event) => {
							onChange(event.target.value);
						}}
						className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0"
					/>
				</>
			)}
		</div>
	);
};

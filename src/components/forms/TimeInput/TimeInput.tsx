import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface TimeInputProps {
	id?: string;
	/** "HH:mm" (what the forms and the API use); "" when empty */
	value: string;
	/** Gets "HH:mm", or "" while the typed time is incomplete/invalid */
	onChange: (value: string) => void;
	onBlur?: () => void;
	disabled?: boolean;
	className?: string;
	"aria-label"?: string;
}

// 1930 -> 19:30 while typing
const mask = (text: string) => {
	const digits = text.replace(/\D/g, "").slice(0, 4);
	return digits.length > 2
		? `${digits.slice(0, 2)}:${digits.slice(2)}`
		: digits;
};

/** "19:30" when it is a time of the day; "" otherwise */
const toTime = (text: string) => {
	const match = /^(\d{2}):(\d{2})$/.exec(text);
	if (!match) return "";
	const [hours, minutes] = [Number(match[1]), Number(match[2])];
	return hours <= 23 && minutes <= 59 ? text : "";
};

/**
 * Time field always shown as hh:mm, 24h. The browser's <input type="time">
 * follows the browser language, so an English Chrome showed AM/PM and left
 * gaps in narrow fields. The clock button still opens the native picker
 */
export const TimeInput = ({
	id,
	value,
	onChange,
	onBlur,
	disabled = false,
	className,
	"aria-label": ariaLabel,
}: TimeInputProps) => {
	const [text, setText] = useState(value);
	const pickerRef = useRef<HTMLInputElement>(null);

	const openPicker = () => {
		const picker = pickerRef.current;
		if (!picker) return;
		try {
			picker.showPicker();
		} catch {
			picker.focus();
		}
	};

	// Follows changes from outside (recalculated schedule, form reset) without
	// wiping a time that is still being typed (its value is "" until complete)
	useEffect(() => {
		setText((current) => (toTime(current) === value ? current : value));
	}, [value]);

	return (
		<div className="relative">
			<input
				id={id}
				type="text"
				inputMode="numeric"
				autoComplete="off"
				placeholder="hh:mm"
				maxLength={5}
				aria-label={ariaLabel}
				value={text}
				disabled={disabled}
				className={cn(className, !disabled && "pr-8")}
				onBlur={onBlur}
				onChange={(event) => {
					const masked = mask(event.target.value);
					setText(masked);
					onChange(toTime(masked));
				}}
			/>
			{disabled ? null : (
				<>
					<button
						type="button"
						aria-label="Abrir relógio"
						onClick={openPicker}
						className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
					>
						<Clock size={16} />
					</button>
					{/* Native picker behind the button; only its popup is used */}
					<input
						ref={pickerRef}
						type="time"
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

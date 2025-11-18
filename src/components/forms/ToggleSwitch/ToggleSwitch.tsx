import type React from "react";
import type { FunctionComponent } from "../../../common/types";
import { cn } from "../../../lib/utils/cn";

type ToggleSwitchProps = {
	label: string;
	name: string;
	checked?: boolean;
	setChecked: (checked: boolean) => void;
	className?: string;
	required?: boolean;
};

export const ToggleSwitch = ({
	label,
	name,
	checked,
	setChecked,
	className = "",
	required = false,
}: ToggleSwitchProps): FunctionComponent => {
	const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const { checked } = event.target;
		setChecked(checked);
	};

	return (
		<label className={cn("flex items-center gap-3", className)}>
			<input
				checked={checked}
				className="sr-only"
				name={name}
				type="checkbox"
				onChange={onChange}
			/>

			<div
				className={cn(
					"relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
					checked ? "bg-blue-600" : "bg-gray-200"
				)}
			>
				<span
					className={cn(
						"inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
						checked ? "translate-x-6" : "translate-x-1"
					)}
				/>
			</div>

			<span className="text-sm font-medium text-gray-700">
				{label} {required && <span className="text-red-500">*</span>}
			</span>
		</label>
	);
};

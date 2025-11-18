import type React from "react";
import type { FunctionComponent } from "../../../common/types";

type CheckboxFieldProps = {
	label: string;
	name: string;
	checked?: boolean;
	onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
	className?: string;
};

export const CheckboxField = ({
	label,
	name,
	checked,
	onChange,
	className = "",
}: CheckboxFieldProps): FunctionComponent => {
	return (
		<label
			className={`flex items-center gap-2 text-sm text-gray-700 ${className}`}
		>
			<input
				checked={checked}
				className="h-4 w-4 border-gray-300"
				name={name}
				type="checkbox"
				onChange={onChange}
			/>
			{label}
		</label>
	);
};

declare module "react-input-mask" {
	import type * as React from "react";

	interface InputMaskProps extends React.InputHTMLAttributes<HTMLInputElement> {
		mask: string;
		maskPlaceholder?: string;
		formatChars?: { [key: string]: string };
		permanents?: Array<number>;
		alwaysShowMask?: boolean;
		maskChar?: string | null;
		beforeMaskedValueChange?: (
			newState: any,
			oldState: any,
			userInput: string,
			maskOptions: any
		) => any;
	}

	const InputMask: React.ForwardRefExoticComponent<
		InputMaskProps & React.RefAttributes<HTMLInputElement>
	>;
	export default InputMask;
}

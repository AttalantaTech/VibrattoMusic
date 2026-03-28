import type { ReactNode } from "react";

interface OptionBox {
	headerTitle: string;
	headerIcon: ReactNode;
	children: ReactNode; // current step
}

export const OptionBox = ({ headerTitle, headerIcon, children }: OptionBox) => {
	return (
		<div className="flex flex-col w-full max-h-full gap-6 text-justify">
			<div className="flex w-full items-center gap-6 ">
				<div className="flex items-center justify-center bg-primary-50 p-3 rounded">
					{headerIcon}
				</div>
				<h1 className="text-gray-900 font-bold text-2xl">{headerTitle}</h1>
			</div>
			<hr className="w-full" />
			{children}
		</div>
	);
};

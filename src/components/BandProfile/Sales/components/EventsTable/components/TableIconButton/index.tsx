import type { FC, PropsWithChildren } from "react";

export const TableIconButton: FC<
	PropsWithChildren & { className?: string; onClick?: () => void }
> = ({ children, className, onClick }) => {
	return (
		<button
			className={`p-2 rounded-lg cursor-default hover:bg-gray-200 transition-colors ${className}`}
			onClick={onClick}
		>
			{children}
		</button>
	);
};

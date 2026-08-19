import type { FC, PropsWithChildren } from "react";

export const QuickActionIconButton: FC<
	PropsWithChildren & { className?: string; onClick?: () => void }
> = ({ children, className, onClick }) => {
	return (
		<button
			onClick={onClick}
			className={`py-0.5 px-1.5 border rounded-md flex items-center w-min ${className}`}
		>
			{children}
		</button>
	);
};

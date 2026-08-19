import type { FC, PropsWithChildren } from "react";

export const MoreOptionsDropdownItem: FC<
	PropsWithChildren & { className?: string, onClick?: () => void }
> = ({ children, className, onClick }) => {
	return (
		<button onClick={onClick}
			className={`flex gap-4 px-2 py-2 rounded-md items-center hover:bg-gray-200 cursor-default w-full ${className}`}
		>
			{children}
		</button>
	);
};

import type { ReactNode } from "react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	className?: string;
	size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
	sm: "max-w-md",
	md: "max-w-lg",
	lg: "max-w-2xl",
	xl: "max-w-4xl",
};

export const Modal = ({
	isOpen,
	className,
	children,
	size = "xl",
}: ModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div
				className={`bg-white flex flex-col rounded-lg ${sizeClasses[size]} w-full max-h-[90vh] overflow-auto ${className || ""}`}
			>
				{children}
			</div>
		</div>
	);
};

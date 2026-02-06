import type React from "react";
import { useState, useRef, useEffect, Children } from "react";
import { cn } from "../../../lib/utils/cn";

interface DropdownProps {
	trigger: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	align?: "left" | "right" | "center";
}

export const Dropdown: React.FC<DropdownProps> = ({
	trigger,
	children,
	className,
	align = "right",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const alignmentClasses = {
		left: "left-0",
		right: "right-0",
		center: "left-1/2 transform -translate-x-1/2",
	};

	return (
		<div ref={dropdownRef} className="relative inline-block">
			<div
				onClick={() => {
					if (Children.count(children) > 0) setIsOpen(!isOpen);
				}}
				className="cursor-pointer"
			>
				{trigger}
			</div>

			{isOpen && (
				<div
					onClick={() => {
						if (Children.count(children) > 0) setIsOpen(!isOpen);
					}}
					className={cn(
						"absolute z-50 mt-1 min-w-[8rem] rounded-md border bg-white flex flex-col shadow-md w-max",
						alignmentClasses[align],
						className
					)}
				>
					{children}
				</div>
			)}
		</div>
	);
};

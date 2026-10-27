import type React from "react";
import { useState, Children } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../../lib/utils/cn";

interface DropdownProps {
	trigger: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	align?: "left" | "right" | "center";
	side?: "top" | "bottom";
}

const alignments = {
	left: "start",
	right: "end",
	center: "center",
} as const;

// The menu is rendered in a portal (outside the page flow), so containers with
// overflow, like the tables, no longer cut it off; it also flips to the other
// side or shifts sideways when there is no room on screen
export const Dropdown: React.FC<DropdownProps> = ({
	trigger,
	children,
	className,
	align = "right",
	side = "bottom",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const hasItems = Children.count(children) > 0;

	return (
		<PopoverPrimitive.Root
			open={isOpen && hasItems}
			onOpenChange={(open) => {
				setIsOpen(open && hasItems);
			}}
		>
			{/* Wrapper kept as the positioning context: the tab underline in
			    TabNavigation is absolute to it */}
			<div className="relative inline-block">
				<PopoverPrimitive.Trigger asChild>
					<div className="cursor-pointer">{trigger}</div>
				</PopoverPrimitive.Trigger>
			</div>

			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					side={side}
					align={alignments[align]}
					sideOffset={4}
					collisionPadding={8}
					onClick={() => {
						setIsOpen(false);
					}}
					className={cn(
						"z-50 min-w-[8rem] rounded-md border bg-white flex flex-col shadow-md w-max outline-none",
						className
					)}
				>
					{children}
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
};

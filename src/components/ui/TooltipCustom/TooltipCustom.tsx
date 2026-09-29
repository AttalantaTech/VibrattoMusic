import type * as React from "react";
import { useEffect, useState, type MouseEvent } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TooltipProvider,
} from "../tooltip";

interface TooltipCustomProps {
	trigger: React.ReactNode;
	content: string;
}

const TooltipWithTouchDevice = ({ content, trigger }: TooltipCustomProps) => {
	const [open, setOpen] = useState(false);

	const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setOpen((previous) => !previous);
	};

	return (
		<Tooltip open={open}>
			<TooltipTrigger asChild onClick={handleTriggerClick}>
				<button
					type="button"
					className="inline-flex cursor-pointer border-none bg-transparent p-0 text-inherit outline-none"
				>
					{trigger}
				</button>
			</TooltipTrigger>

			<TooltipContent
				className="w-[300px] text-center"
				onPointerDownOutside={() => {
					setOpen(false);
				}}
			>
				<span>{content}</span>
			</TooltipContent>
		</Tooltip>
	);
};

const TooltipCustom = ({ content, trigger }: TooltipCustomProps) => {
	const [isTouchDevice, setIsTouchDevice] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(pointer: coarse)");
		setIsTouchDevice(mediaQuery.matches);

		const handler = (event: MediaQueryListEvent) => {
			setIsTouchDevice(event.matches);
		};
		mediaQuery.addEventListener("change", handler);
		return () => {
			mediaQuery.removeEventListener("change", handler);
		};
	}, []);

	return (
		<TooltipProvider delayDuration={200}>
			{isTouchDevice ? (
				<TooltipWithTouchDevice content={content} trigger={trigger} />
			) : (
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							className="inline-flex cursor-pointer border-none bg-transparent p-0 text-inherit outline-none"
							onPointerDown={(event) => {
								event.preventDefault();
								event.stopPropagation();
							}}
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
							}}
						>
							{trigger}
						</button>
					</TooltipTrigger>

					<TooltipContent className="w-[300px] text-center">
						<span>{content}</span>
					</TooltipContent>
				</Tooltip>
			)}
		</TooltipProvider>
	);
};

TooltipCustom.displayName = "TooltipCustom";

export { TooltipCustom };

import type * as React from "react";
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
const TooltipCustom = ({ content, trigger }: TooltipCustomProps) => {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger>{trigger}</TooltipTrigger>

				<TooltipContent className="w-1/5">
					<span>{content}</span>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

TooltipCustom.displayName = "TooltipCustom";

export { TooltipCustom };

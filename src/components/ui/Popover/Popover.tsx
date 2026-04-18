import { useState } from "react";
import {
	Popover as PopoverProvider,
	PopoverContent,
	PopoverTrigger,
} from "../popover";
import { PopoverArrow } from "@radix-ui/react-popover";

interface PopoverProps {
	trigger: React.ReactNode;
	content: string;
	disabled?: boolean;
}
const Popover = ({ content, trigger, disabled }: PopoverProps) => {
	const [open, setOpen] = useState(false);

	return (
		<PopoverProvider open={open} onOpenChange={setOpen}>
			<PopoverTrigger>{trigger}</PopoverTrigger>

			{disabled && (
				<PopoverContent
					side="top"
					className="max-w-[300px] bg-primary-50 text-primary-700 border border-primary-200 rounded-lg w-auto text-center text-sm py-1 mr-3"
				>
					<PopoverArrow className="fill-primary-100" />
					{content}
				</PopoverContent>
			)}
		</PopoverProvider>
	);
};

PopoverProvider.displayName = "Popover";

export { Popover };

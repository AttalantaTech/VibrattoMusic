import { CheckCircleIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

type AccordionProps = {
	title: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	description: string;
	isExpanded: boolean;
	isComplete: boolean;
	onToggle: () => void;
};

export const Accordion = ({
	title,
	icon,
	children,
	description,
	isExpanded,
	isComplete,
	onToggle,
}: AccordionProps) => {
	return (
		<div className="border border-gray-200 rounded-lg">
			<button
				type="button"
				onClick={onToggle}
				className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
			>
				<div className="flex items-center space-x-3">
					<div className="flex-shrink-0">{icon}</div>
					<div>
						<h3 className="font-medium text-gray-900">{title}</h3>
						<p className="text-sm text-gray-600">{description}</p>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					{isComplete && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
					{isExpanded ? (
						<ChevronUpIcon className="h-5 w-5 text-gray-400" />
					) : (
						<ChevronDownIcon className="h-5 w-5 text-gray-400" />
					)}
				</div>
			</button>
			{isExpanded && (
				<div className="px-4 pb-4 space-y-4 border-t border-gray-100">
					{children}
				</div>
			)}
		</div>
	);
};

import { FileSignature, FileText, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ProposalView = "progress" | "details" | "contract";

interface ProposalViewTabsProps {
	view: ProposalView;
	/** The contract exists from the acceptance on */
	hasContract: boolean;
	onChange: (view: ProposalView) => void;
}

const TABS: Array<{
	view: ProposalView;
	label: string;
	icon: typeof FileText;
}> = [
	{ view: "progress", label: "Andamento", icon: ListChecks },
	{ view: "details", label: "Proposta", icon: FileText },
	{ view: "contract", label: "Contrato", icon: FileSignature },
];

/** Switches between the progress, proposal and contract dialogs */
export const ProposalViewTabs = ({
	view,
	hasContract,
	onChange,
}: ProposalViewTabsProps) => (
	<div
		role="tablist"
		className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm"
	>
		{TABS.filter((tab) => tab.view !== "contract" || hasContract).map(
			({ view: tabView, label, icon: Icon }) => (
				<button
					key={tabView}
					type="button"
					role="tab"
					aria-selected={view === tabView}
					onClick={() => {
						onChange(tabView);
					}}
					className={cn(
						"flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
						view === tabView
							? "bg-white text-gray-900 shadow-sm"
							: "text-gray-500 hover:text-gray-900"
					)}
				>
					<Icon className="h-4 w-4" />
					{label}
				</button>
			)
		)}
	</div>
);

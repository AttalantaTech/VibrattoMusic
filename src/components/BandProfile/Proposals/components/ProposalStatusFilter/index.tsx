import type { Option } from "@/components/forms/Select/Select";
import { Select } from "@/components/forms/Select/Select";
import {
	proposalStatusFilters,
	proposalStatusLabel,
} from "../ProposalStatusCard/types";

const ALL_STATUSES = "Todos os status";

const options: Array<Option> = proposalStatusFilters.map((status) => ({
	value: status,
	label: proposalStatusLabel(status),
}));

type ProposalStatusFilterProps = {
	/** A proposal status, or "Todos os status" */
	value: string;
	onChange: (status: string) => void;
};

/**
 * Status filter of Vendas and Contratações, on the standard selector: "Todos
 * os status" is the empty state, and the "x" of a chosen status goes back to it
 */
export const ProposalStatusFilter = ({
	value,
	onChange,
}: ProposalStatusFilterProps) => (
	<div className="w-full sm:w-56">
		<Select
			name="statusFilter"
			options={options}
			placeholder={ALL_STATUSES}
			selectedOptions={
				value === ALL_STATUSES
					? []
					: options.filter((option) => option.value === value)
			}
			setSelectedOptions={(selected) => {
				onChange(selected[0]?.value ?? ALL_STATUSES);
			}}
		/>
	</div>
);

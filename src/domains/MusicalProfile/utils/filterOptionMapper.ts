import type { FilterOption } from "@/api/types";
import type { Option } from "@/components/forms/Select/Select";

export function mapFilterOptions(options: Array<FilterOption>): Array<Option> {
	return options.map((option) => ({
		value: String(option.Id),
		label: option.Nome,
	}));
}

import type { FC } from "react";
import {
	proposalStatusCardConfigDict,
	type ProposalStatusCardProps,
} from "./types";
import { splitOnUppercase } from "@/utils/labels";

export const ProposalStatusCard: FC<ProposalStatusCardProps> = ({ name }) => {
	const proposalStatusCardInfo = proposalStatusCardConfigDict[name];
	const Icon = proposalStatusCardInfo?.icon;

	return (
		<div className={`flex`}>
			<div
				className={`flex items-center gap-2
					${proposalStatusCardInfo ? proposalStatusCardInfo.bgColor : "bg-gray-100"}
					${proposalStatusCardInfo ? proposalStatusCardInfo.color : "text-gray-800"}
					border-[1px]
					${proposalStatusCardInfo ? proposalStatusCardInfo.borderColor : "border-gray-300"} py-0.5 px-1 rounded-md flex items-center gap-2 text-[12px] font-bold
				`}
			>
				{Icon && <Icon size={14} />}
				{proposalStatusCardInfo?.label ?? splitOnUppercase(name)}
			</div>
		</div>
	);
};

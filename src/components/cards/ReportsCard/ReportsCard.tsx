import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import type { Report } from "../../../common/types";

interface ReportsCardProps {
	report: Report;
}

export const ReportsCard = ({ report }: ReportsCardProps) => {
	return (
		<div className="flex w-full bg-gray-50 gap-12 rounded-md px-2 py-4 border border-[#E1E3EA] items-center">
			<div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-600">
				{report.icon}
			</div>
			<div className="flex flex-col w-full gap-2">
				<div className="flex w-full items-center justify-between">
					<span className="text-gray-900 font-bold text-xl">
						{`R$ ${report.value}`}
					</span>
					<span
						className={`flex gap-1 ${report.isUp ? "text-[#027A48]" : "text-[#B42318]"}`}
					>
						<span>
							{report.isUp ? (
								<ArrowUpIcon size={20} />
							) : (
								<ArrowDownIcon size={20} />
							)}
						</span>
						<span>{report.percentage}%</span>
					</span>
				</div>
				<span className="text-[#667085] text-xs">{report.label}</span>
			</div>
		</div>
	);
};

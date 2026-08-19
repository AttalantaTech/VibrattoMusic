import type { FC } from "react";
import { StatusCardConfigDict, type PaymentStatusCardProps } from "./types";
import { splitOnUppercase } from "@/utils/labels";

export const PaymentStatusCard: FC<PaymentStatusCardProps> = ({ name }) => {
	const paymentStatusCardInfo = StatusCardConfigDict[name];
	const Icon = paymentStatusCardInfo?.icon;

	return (
		<div
			className={`
                ${paymentStatusCardInfo ? paymentStatusCardInfo.bgColor : "bg-gray-100"}
                ${paymentStatusCardInfo ? paymentStatusCardInfo.color : "text-gray-800"}
                border-[1px]
                ${paymentStatusCardInfo ? paymentStatusCardInfo.borderColor : "border-gray-300"} w-min py-0.5 px-1 rounded-md flex items-center gap-2 text-[12px] font-bold
                `}
		>
			{Icon && <Icon size={14} />}
			{paymentStatusCardInfo?.label ?? splitOnUppercase(name)}
		</div>
	);
};

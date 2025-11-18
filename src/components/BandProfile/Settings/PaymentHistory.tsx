import { ClockIcon, HandCoinsIcon } from "lucide-react";
import { OptionBox } from "../../OptionBox/OptionBox";

export const PaymentHistory = () => {
	const payment = {
		title: "Show Empresarial",
		date: new Date(2023, 12, 24, 13, 20),
		inflow: true,
		value: 400.0,
	};

	return (
		<OptionBox
			headerIcon={<ClockIcon color="#007bff" size={24} />}
			headerTitle="Histórico de Pagamentos"
		>
			<div className="flex flex-col gap-3">
				{Array.from({ length: 15 }).map((_, index) => (
					<div
						key={index}
						className="flex w-full px-3 py-4 gap-3 border border-gray-100 bg-white items-center justify-between"
					>
						<div className="flex gap-3">
							<div className="h-full bg-[#ECFDF3] rounded-full p-3">
								<HandCoinsIcon color="#027A48" size={20} />
							</div>
							<div className="flex flex-col justify-center">
								<h1 className="text-gray-900 font-semibold">{payment.title}</h1>
								<p className="text-sm text-gray-500">
									{payment.date.toLocaleDateString()}
								</p>
							</div>
						</div>
						<div className="text-[#027A48] font-medium">
							<span>{payment.inflow ? "+" : "-"}</span>
							<span>R$ {payment.value.toFixed(2)}</span>
						</div>
					</div>
				))}
			</div>
		</OptionBox>
	);
};

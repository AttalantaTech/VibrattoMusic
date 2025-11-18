import { ChartLineIcon } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { EventsTable } from "./EventsTable";
import { Reports } from "./Reports";
import { FilterSelector } from "../../ui/FilterSelector/FilterSelector";
import { LineChartComponent } from "../../charts/line/LineChart";
import { useState } from "react";
import { UpdateButton } from "../../ui/UpdateButton/UpdateButton";
import { dates, values, myEvents } from "./data";
import { SendProposalModal } from "../Messages/SendProposalModal";
import { useActiveMusicalProduct } from "../../../hooks/useActiveMusicalProduct";

interface MySalesTabProps {
	productId?: number;
}

export const MySalesTab = ({ productId }: MySalesTabProps) => {
	const [selectedChartFilters, setSelectedChartFilters] = useState<
		Array<string>
	>([]);
	const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
	const chartFilters = [{ id: "sales", label: "Vendas" }];

	// Get active product from centralized hook
	const { activeProduct } = useActiveMusicalProduct();

	// Use prop productId if provided, otherwise use active product
	const currentProductId = productId || (activeProduct?.id ? Number(activeProduct.id) : undefined);

	return (
		<div className="w-full h-full flex flex-col gap-4">
			<div className="flex w-full items-center justify-between">
				<h1 className="font-bold text-2xl">Vendas</h1>
				<Button
					onClick={() => {
						setIsProposalModalOpen(true);
					}}
				>
					+ Criar proposta
				</Button>
			</div>
			<hr className="w-full" />

			<EventsTable data={myEvents} />

			<h1 className="font-bold text-2xl">Relatórios</h1>
			<hr className="w-full" />

			<Reports />

			<div className="flex flex-col w-full bg-gray-50 border border-gray-200 gap-6 p-6 rounded-lg">
				<div className="w-full flex items-center justify-between">
					<div className="flex gap-3 items-center">
						<div className="bg-white border border-gay-300 rounded-lg p-2 text-gray-600">
							<ChartLineIcon size={14} />
						</div>
						<FilterSelector
							filters={chartFilters}
							selectedFilters={selectedChartFilters}
							onFilterChange={setSelectedChartFilters}
						/>
					</div>
					<UpdateButton
						onClick={() => {
							// Handle update
						}}
					/>
				</div>
				<LineChartComponent dates={dates} values={values} />
			</div>

			{/* SendProposalModal */}
			<SendProposalModal
				isOpen={isProposalModalOpen}
				onClose={() => {
					setIsProposalModalOpen(false);
				}}
				recipientId={currentProductId}
			/>
		</div>
	);
};

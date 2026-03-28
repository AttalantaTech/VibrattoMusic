import { useState } from "react";
import { Calendar, List } from "lucide-react";
import { BookingManagementTab } from "./BookingManagementTab";
import { BookingCalendar } from "./BookingCalendar";
import { useBookingStats } from "../../../hooks/useBookings";
import type { MusicalProduct } from "../../../api/types";

const tabs = [
	{ label: "Lista", value: "list", icon: List },
	{ label: "Calendário", value: "calendar", icon: Calendar },
];

interface BookingTabsProps {
	musicalProduct?: MusicalProduct;
}

export const BookingTabs = ({ musicalProduct }: BookingTabsProps) => {
	const [currentTab, setCurrentTab] = useState("list");

	// Fetch booking stats for the header
	const { data: stats } = useBookingStats();

	const renderTabContent = () => {
		switch (currentTab) {
			case "list":
				return <BookingManagementTab />;
			case "calendar":
				return (
					<BookingCalendar
						productId={musicalProduct?.id}
						musicalProduct={musicalProduct}
					/>
				);
			default:
				return <BookingManagementTab />;
		}
	};

	return (
		<div className="w-full h-full flex flex-col gap-6">
			{/* Header with Stats Summary */}
			<div className="bg-white rounded-lg border p-6">
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="font-bold text-2xl text-gray-900">
							Central de Contratações
						</h1>
						<p className="text-gray-600 text-sm mt-1">
							Gerencie suas contratações, agenda e acompanhe estatísticas
						</p>
					</div>
				</div>
				{/* Quick Stats */}
				{stats && (
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
						<div className="bg-primary-50 rounded-lg p-4">
							<div className="text-2xl font-bold text-primary-600">
								{stats.totalBookings}
							</div>
							<div className="text-sm text-primary-600">Total</div>
						</div>
						<div className="bg-yellow-50 rounded-lg p-4">
							<div className="text-2xl font-bold text-yellow-600">
								{stats.pendentes}
							</div>
							<div className="text-sm text-yellow-600">Pendentes</div>
						</div>
						<div className="bg-green-50 rounded-lg p-4">
							<div className="text-2xl font-bold text-green-600">
								{stats.confirmados}
							</div>
							<div className="text-sm text-green-600">Confirmados</div>
						</div>
						<div className="bg-purple-50 rounded-lg p-4">
							<div className="text-2xl font-bold text-purple-600">
								{stats.concluidos}
							</div>
							<div className="text-sm text-purple-600">Concluídos</div>
						</div>
						<div className="bg-emerald-50 rounded-lg p-4">
							<div className="text-2xl font-bold text-emerald-600">
								R$ {stats.receitaMensal.toFixed(0)}
							</div>
							<div className="text-sm text-emerald-600">Receita Mensal</div>
						</div>
					</div>
				)}{" "}
				{/* Tab Navigation */}
				<div className="flex gap-3">
					{tabs.map((tab) => {
						const isActive = tab.value === currentTab;
						const IconComponent = tab.icon;

						return (
							<button
								key={tab.value}
								className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
									isActive
										? "bg-primary-600 text-white border-primary-600"
										: "text-gray-700 border-gray-300 hover:border-primary-600 hover:text-primary-600"
								}`}
								onClick={() => {
									setCurrentTab(tab.value);
								}}
							>
								<IconComponent className="w-4 h-4" />
								{tab.label}
							</button>
						);
					})}
				</div>
			</div>

			{/* Tab Content */}
			<div className="flex-1 overflow-hidden">{renderTabContent()}</div>
		</div>
	);
};

import { TabNavigation } from "../../components/ui/TabNavigation/TabNavigation";
import { ImprovedSettingsTab } from "../../components/BandProfile/Settings/ImprovedSettingsTab";
import { MainLayout } from "../../components/layout/MainLayout/MainLayout";
import { AgendaTab } from "../../components/BandProfile/Agenda/AgendaTab";
import { FavoritesTab } from "../../components/BandProfile/Favorites/FavoritesTab";
import { OnboardingProvider } from "../../contexts/OnboardingContext";
import { useTabWithUrl } from "../../hooks/useTabWithUrl";
import { MyHiresTab } from "../../components/BandProfile/Hires/MyHiresTab";
import MessagesTab from "../../components/BandProfile/Messages";
import { ProposalsTab } from "../../components/BandProfile/Proposals/ProposalsTab";
import { ContractsTab } from "../../components/BandProfile/Contracts/ContractsTab";
import { SalesTab } from "../../components/BandProfile/Sales/SalesTab";
import { ProfileTab } from "@/components/BandProfile/Account/ProfileTab";
import { useOnboardingData } from "@/hooks/useOnboarding";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import { OnboardingsPedingModal } from "@/components/BandProfile/Account/OnboardingsPedingModal";
import { useState } from "react";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { ChecklistTab } from "@/components/BandProfile/Checklist/ChecklistTab";
import { BudgetsTab } from "@/components/BandProfile/Budgets/BudgetsTab";

export const BandProfile = () => {
	// Use URL-synced tab state
	const [activeMainTab, setActiveMainTab] = useTabWithUrl(
		"/band/me",
		"messages"
	);

	const [openOnboardingsPending, setOpenOnboardingsPending] =
		useState<boolean>(false);

	const { activeProduct } = useMusicalProductStore();

	const { data: onboardingData } = useOnboardingData();

	// Get the active product ID for child components
	const activeProductId = activeProduct?.id ? activeProduct.id : undefined;

	const mainTabs = activeProduct
		? [
				//Musical Product
				{ label: "Conta", value: "account" },
				{ label: "Mensagens", value: "messages" },
				{ label: "Agenda", value: "bookings" },
				{
					label: "Vendas",
					value: "sales",
					subTabs: [
						{ label: "Minhas Vendas", value: "sales" },
						{ label: "Solicitação de Orçamentos", value: "budgets" },
						{ label: "Modelos de Contratos", value: "contracts" },
					],
				},
				{ label: "Contratações", value: "hires" },
				{ label: "Checklist", value: "checklist" },
				{ label: "Ajustes", value: "settings" },
			]
		: [
				// Contractor
				{ label: "Mensagens", value: "messages" },
				{ label: "Contratações", value: "hires" },
				{ label: "Favoritos", value: "favorites" },
				{ label: "Ajustes", value: "settings" },
			]; // Function to render content based on active tab

	const renderTabContent = () => {
		switch (activeMainTab) {
			case "bookings":
				return <AgendaTab />;
			case "settings":
				return (
					<OnboardingProvider>
						<ImprovedSettingsTab />
					</OnboardingProvider>
				);
			case "messages":
				return <MessagesTab />;
			case "sales":
				return (
					<div className="flex flex-col w-full h-full gap-6">
						<SalesTab />
					</div>
				);
			case "hires":
				return <MyHiresTab />;
			case "proposals":
				return <ProposalsTab productId={activeProductId} />;
			case "contracts":
				return <ContractsTab />;
			case "budgets":
				return <BudgetsTab />;
			case "checklist":
				return <ChecklistTab />;
			case "favorites":
				return <FavoritesTab />;
			case "account":
			default:
				return <ProfileTab />;
		}
	};
	return (
		<MainLayout>
			{/** Pending onboardings warning */}
			{onboardingData && onboardingData?.length > 0 ? (
				<div className="flex justify-center py-10">
					<div className="flex flex-col sm:flex-row items-center gap-4 bg-yellow-50 border-2 rounded-md p-4">
						<TriangleAlert fill="#fde047" className="h-8 w-8" />
						<span className="block">
							Você possui{" "}
							<strong>
								{onboardingData.length}{" "}
								{onboardingData.length === 1
									? "perfil pendente"
									: "perfis pendentes"}
							</strong>
							. Clique no botão para visualizar{" "}
							{onboardingData.length === 1 ? "este perfil" : "estes perfis"} e
							prosseguir com o cadastro.
						</span>

						<Button
							className="w-full sm:w-auto min-w-[140px]"
							size="sm"
							variant="primary"
							onClick={() => {
								setOpenOnboardingsPending(true);
							}}
						>
							Perfis Pendentes
						</Button>
					</div>
				</div>
			) : null}

			{/* Tab Navigation - specific to band profile */}
			<div className="w-full h-16 sm:h-18 border-b border-gray-100 overflow-visible scrollbar-hide flex items-center">
				<TabNavigation
					currentTab={activeMainTab}
					tabs={mainTabs}
					onChange={setActiveMainTab}
					variant="underline"
				/>
			</div>

			<main className="flex flex-col w-full h-fit items-start justify-start p-4 sm:p-6 lg:p-8 xl:p-10">
				<div className="flex flex-col lg:flex-row w-full items-start gap-4 lg:gap-8 justify-start lg:justify-center max-w-9xl mx-auto">
					{/* Content */}
					{renderTabContent()}
				</div>
			</main>

			<OnboardingsPedingModal
				isOpen={openOnboardingsPending}
				setIsOpen={setOpenOnboardingsPending}
				onboardingsPedingTable={{ data: onboardingData ?? [] }}
			/>
		</MainLayout>
	);
};

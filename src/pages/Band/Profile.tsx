import { TabNavigation } from "../../components/ui/TabNavigation/TabNavigation";
import { ImprovedSettingsTab } from "../../components/BandProfile/Settings/ImprovedSettingsTab";
import { MainLayout } from "../../components/layout/MainLayout/MainLayout";
import { AgendaTab } from "../../components/BandProfile/Agenda/AgendaTab";
import { FavoritesTab } from "../../components/BandProfile/Favorites/FavoritesTab";
import { OnboardingProvider } from "../../contexts/OnboardingContext";
import { useTabWithUrl } from "../../hooks/useTabWithUrl";
import { MyHiresTab } from "../../components/BandProfile/Hires/MyHiresTab";
import { useActiveMusicalProduct } from "../../hooks/useActiveMusicalProduct";
import MessagesTab from "../../components/BandProfile/Messages";
import { ProposalsTab } from "../../components/BandProfile/Proposals/ProposalsTab";
import { ContractsTab } from "../../components/BandProfile/Contracts/ContractsTab";
import { MessagesContextProvider } from "@/components/BandProfile/Messages/contexts/MessagesContext/provider";
import { SalesTab } from "../../components/BandProfile/Sales/SalesTab";
import { ProfileTab } from "@/components/BandProfile/Account/ProfileTab";

export const BandProfile = () => {
	// Use URL-synced tab state
	const [activeMainTab, setActiveMainTab] = useTabWithUrl(
		"/band/me",
		"messages"
	);

	// Get active musical product state
	const { activeProduct } = useActiveMusicalProduct();

	// Get the active product ID for child components
	const activeProductId = activeProduct?.id ? activeProduct.id : undefined;

	// Check if user has musical products to show sales tab
	// const hasMusicalProducts = myProducts?.data && myProducts.data.length > 0;

	const mainTabs = [
		{ label: "Conta", value: "account" },
		{ label: "Mensagens", value: "messages" /* , badgeCount: 4 */ },
		{ label: "Agenda", value: "bookings" },
		{
			label: "Vendas",
			value: "sales",
			subTabs: [
				{ label: "Minhas Vendas", value: "sales" },
				{ label: "Modelos de Contratos", value: "contracts" },
			],
		},
		// { label: "Propostas", value: "proposals" },
		// { label: "Contratos", value: "contracts" },
		{ label: "Contratações", value: "hires" },
		{ label: "Favoritos", value: "favorites" },
		{ label: "Ajustes", value: "settings" },
	]; // Function to render content based on active tab

	const renderTabContent = () => {
		switch (activeMainTab) {
			case "bookings":
				return <AgendaTab productId={activeProductId} />;
			case "settings":
				return (
					<OnboardingProvider>
						<ImprovedSettingsTab />
					</OnboardingProvider>
				);
			case "messages":
				return (
						<MessagesTab />
				);
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
			case "favorites":
				return <FavoritesTab />;
			case "account":
			default:
				return <ProfileTab />;
		}
	};
	return (
		<MainLayout>
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
		</MainLayout>
	);
};

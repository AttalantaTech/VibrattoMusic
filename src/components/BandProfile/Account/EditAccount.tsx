import { useEffect, useRef, useState } from "react";

import ContactSection from "./Sections/ContactSection";
import DetailsSection from "./Sections/DetailsSection";
import MediaSection from "./Sections/MediaSection";
import TechnicalSection from "./Sections/TechnicalSection";
import { SidebarCustom } from "../../ui/SidebarCustom/SidebarCustom";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { TabNavigation } from "../../ui/TabNavigation/TabNavigation";

export const EditAccount = () => {
	const [activeSection, setActiveSection] = useState<string>("contact");
	const topRef = useRef<HTMLDivElement>(null);

	// A section's own "Continuar" switches to the next one while the page is
	// still scrolled to the bottom: bring the start of the new section back
	useEffect(() => {
		const top = topRef.current?.getBoundingClientRect().top;
		// 80px: fixed header (64px) + a little room
		if (top !== undefined && top < 0) {
			window.scrollTo({ top: window.scrollY + top - 80, behavior: "smooth" });
		}
	}, [activeSection]);

	const sidebarItems = [
		{
			id: "contact",
			label: "Informações de Contato",
		},
		{
			id: "detail",
			label: "Informações Profissionais",
		},
		{
			id: "media",
			label: "Mídia Kit e Visibilidade",
		},
		{
			id: "maps-and-technical",
			label: "Mapas e Configurações Técnicas",
		},
	];

	// Function to render content based on active tab
	const renderContent = () => {
		switch (activeSection) {
			case "contact":
				return <ContactSection />;
			case "detail":
				return <DetailsSection onActiveSection={setActiveSection} />;
			case "media":
				return (
					<OnboardingProvider>
						<MediaSection onActiveSection={setActiveSection} />
					</OnboardingProvider>
				);
			default:
				return <TechnicalSection onActiveSection={setActiveSection} />;
		}
	};

	return (
		<div ref={topRef} className="w-full">
			{/* Phones/tablets: sections as tabs on top. The sidebar sat after the
			    form there (~2000px down), so the other 3 sections went unnoticed */}
			<div className="mb-4 border-b border-gray-100 lg:hidden">
				<TabNavigation
					tabs={sidebarItems.map((item) => ({
						label: item.label,
						value: item.id,
					}))}
					currentTab={activeSection}
					onChange={setActiveSection}
					variant="underline"
				/>
			</div>

			<div className="flex flex-col-reverse flex-1 lg:flex-row gap-6 max-w-7xl mx-auto">
				{/* "contents" keeps the sidebar's own lg widths working */}
				<div className="hidden lg:contents">
					<SidebarCustom
						items={sidebarItems}
						activeItem={activeSection}
						setActiveItem={setActiveSection}
					/>
				</div>

				{/* Content */}
				<div className="flex-1">{renderContent()}</div>
			</div>
		</div>
	);
};

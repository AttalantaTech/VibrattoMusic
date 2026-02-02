import { useState } from "react";

import ContactSection from "./Sections/ContactSection";
import DetailsSection from "./Sections/DetailsSection";
import MediaSection from "./Sections/MediaSection";
import TechnicalSection from "./Sections/TechnicalSection";
import { SidebarCustom } from "../../ui/SidebarCustom/SidebarCustom";

export const EditAccount = () => {
	const [activeSection, setActiveSection] = useState<string>("contact");

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
				return <MediaSection onActiveSection={setActiveSection} />;
			default:
				return <TechnicalSection onActiveSection={setActiveSection} />;
		}
	};

	return (
		<div className="w-full">
			<div className="flex flex-col-reverse flex-1 lg:flex-row gap-6 max-w-7xl mx-auto">
				<SidebarCustom
					items={sidebarItems}
					activeItem={activeSection}
					setActiveItem={setActiveSection}
				/>

				{/* Content */}
				<div className="flex-1">{renderContent()}</div>
			</div>
		</div>
	);
};

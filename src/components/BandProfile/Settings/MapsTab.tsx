import { MapIcon } from "lucide-react";
import { OptionBox } from "../../OptionBox/OptionBox";
import TechnicalStep from "../../BandOnboarding/steps/TechnicalStep";

export const MapsTab = () => {
	return (
		<OptionBox
			headerIcon={<MapIcon color="#007bff" size={24} />}
			headerTitle="Rider e Configurações Técnicas"
		>
			<TechnicalStep />
		</OptionBox>
	);
};

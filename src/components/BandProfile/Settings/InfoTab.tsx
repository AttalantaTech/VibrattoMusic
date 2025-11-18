import { InfoIcon } from "lucide-react";
import { OptionBox } from "../../OptionBox/OptionBox";
import DetailsStep from "../../BandOnboarding/steps/DetailsStep";

export const InfoTab = () => {
	return (
		<OptionBox
			headerIcon={<InfoIcon color="#007bff" size={24} />}
			headerTitle="Informações da Banda"
		>
			<DetailsStep />
		</OptionBox>
	);
};

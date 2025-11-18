import { UserIcon } from "lucide-react";
import { OptionBox } from "../../OptionBox/OptionBox";
import ContactStep from "../../BandOnboarding/steps/ContactStep";

export const ContactTab = () => {
	return (
		<OptionBox
			headerIcon={<UserIcon color="#007bff" size={24} />}
			headerTitle="Informações de Contato"
		>
			<ContactStep />
		</OptionBox>
	);
};

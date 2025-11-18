import { ImageIcon } from "lucide-react";
import { OptionBox } from "../../OptionBox/OptionBox";
import MediaStep from "../../BandOnboarding/steps/MediaStep";

export const MidiaKitTab = () => {
	return (
		<OptionBox
			headerIcon={<ImageIcon color="#007bff" size={24} />}
			headerTitle="Mídia Kit e Visibilidade"
		>
			<MediaStep />
		</OptionBox>
	);
};

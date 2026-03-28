import { Button } from "../Button/Button";
import { RefreshCwIcon } from "lucide-react";

interface UpdateButtonProps {
	onClick: () => void;
}

export const UpdateButton = ({ onClick }: UpdateButtonProps) => {
	return (
		<Button
			className="text-primary-600 font-bold flex gap-1"
			variant="transparent"
			onClick={onClick}
		>
			<span>
				<RefreshCwIcon />
			</span>
			<span>Atualizar</span>
		</Button>
	);
};

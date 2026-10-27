import { Button } from "../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";

export const FinishModal = ({
	isOpen,
	onClose,
	onFinish,
}: {
	isOpen: boolean;
	onClose: () => void;
	onFinish: () => void;
}) => {
	const handleFinish = () => {
		onFinish();
		onClose();
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="max-w-md">
				<div className="flex flex-col w-full gap-2 items-center text-center">
					<DialogTitle className="text-lg font-semibold text-gray-900">
						Finalizar cadastro
					</DialogTitle>
					<DialogDescription className="text-gray-600 text-xs">
						Publique o seu perfil ou salve como rascunho
					</DialogDescription>
				</div>

				{/* Phones: full-width buttons, the main action on top */}
				<div className="flex flex-col-reverse gap-3 mt-4 w-full sm:flex-row sm:justify-center">
					<Button variant="outline" onClick={onClose}>
						Salvar como rascunho
					</Button>
					<Button className="flex gap-2" onClick={handleFinish}>
						Publicar perfil
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

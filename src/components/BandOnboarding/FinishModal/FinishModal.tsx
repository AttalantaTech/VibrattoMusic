import { X } from "lucide-react";
import { Button } from "../../ui/Button/Button";

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

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg p-4 w-full max-w-4xl">
				<div className="flex justify-end items-center ">
					<button
						className="text-gray-500 hover:text-gray-700"
						onClick={onClose}
					>
						<X size={24} />
					</button>
				</div>

				<div className="flex flex-col w-full h-full gap-3">
					<div className="flex flex-col w-full gap-2 justify-start items-center">
						<h1 className="text-lg font-semibold text-gray-900">
							Finalizar cadastro
						</h1>
						<p className="text-gray-600 text-xs">
							Publique o seu perfil ou salve como rascunho
						</p>
					</div>

					<div className="flex justify-center items-center gap-3 mt-4 w-full">
						<Button variant="outline" onClick={onClose}>
							Salvar como rascunho
						</Button>
						<Button className="flex gap-2" onClick={handleFinish}>
							Publicar perfil
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

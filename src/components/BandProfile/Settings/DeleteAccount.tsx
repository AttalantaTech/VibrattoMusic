import { AlertCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/Button/Button";

export const DeleteAccountTab = () => {
	const [isConfirming, setIsConfirming] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDeleteAccount = () => {
		setIsDeleting(true);
		// Aqui você faria a chamada à API para deletar a conta
		setIsDeleting(false);
		// Em caso real, redirecionar para página de confirmação ou login
	};

	return (
		<div className="flex flex-col gap-6 max-w-2xl">
			<div className="flex items-center gap-3 text-red-600">
				<AlertCircle size={24} />
				<h2 className="text-xl font-bold">Excluir minha conta</h2>
			</div>

			<div className="space-y-4">
				<p className="text-gray-700">
					Ao excluir sua conta, todas as suas informações, dados e configurações
					serão permanentemente removidos. Esta ação não pode ser desfeita.
				</p>

				<ul className="list-disc pl-5 space-y-2 text-gray-700">
					<li>Todos os seus dados pessoais serão apagados</li>
					<li>Seus pagamentos e histórico serão perdidos</li>
					<li>Qualquer conteúdo publicado será removido</li>
					<li>Você perderá acesso a todos os serviços</li>
				</ul>

				{!isConfirming ? (
					<Button
						className="mt-6"
						variant="danger"
						onClick={() => {
							setIsConfirming(true);
						}}
					>
						<Trash2 className="mr-2" size={18} />
						Excluir minha conta
					</Button>
				) : (
					<div className="space-y-4 mt-6">
						<p className="font-medium text-red-600">
							Tem certeza absoluta que deseja excluir sua conta?
						</p>
						<div className="flex gap-4">
							<Button
								disabled={isDeleting}
								variant="danger"
								onClick={handleDeleteAccount}
							>
								<Trash2 className="mr-2" size={18} />
								Sim, excluir permanentemente
							</Button>
							<Button
								disabled={isDeleting}
								variant="outline"
								onClick={() => {
									setIsConfirming(false);
								}}
							>
								Cancelar
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

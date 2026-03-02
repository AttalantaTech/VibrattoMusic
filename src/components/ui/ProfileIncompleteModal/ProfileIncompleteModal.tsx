import { useNavigate } from "@tanstack/react-router";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../dialog";
import { Button } from "../Button/Button";
import { AlertTriangle, Check, X } from "lucide-react";
import { useProfileStatus } from "../../../hooks/useProfileStatus";

interface ProfileIncompleteModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const ProfileIncompleteModal = ({
	isOpen,
	onClose,
}: ProfileIncompleteModalProps) => {
	const navigate = useNavigate();
	const { musicalProducts } = useProfileStatus();

	const handleCompleteProfile = async () => {
		onClose();
		// Redirect to band profile settings or registration
		await navigate({ to: "/band/register" });
	};

	// Helper function to check individual fields
	const getProfileRequirements = () => {
		if (!musicalProducts || musicalProducts.dados.length === 0) {
			return {
				hasProduct: false,
				requirements: [
					{ label: "Produto Musical", completed: false },
					{ label: "Nome do Produto", completed: false },
					{ label: "Descrição", completed: false },
					{ label: "Foto de Perfil", completed: false },
					{ label: "Logo", completed: false },
					{ label: "Informações de Contato", completed: false },
					{ label: "Categoria", completed: false },
					{ label: "Cidade", completed: false },
					{ label: "Tipos de Evento", completed: false },
					{ label: "Gêneros Musicais", completed: false },
					{ label: "Tipos de Produção", completed: false },
					{ label: "Imagens do Portfólio", completed: false },
				],
			};
		}

		const product = musicalProducts.dados[0];
		if (!product) {
			return {
				hasProduct: false,
				requirements: [
					{ label: "Produto Musical", completed: false },
					{ label: "Nome do Produto", completed: false },
					{ label: "Descrição", completed: false },
					{ label: "Foto de Perfil", completed: false },
					{ label: "Logo", completed: false },
					{ label: "Informações de Contato", completed: false },
					{ label: "Categoria", completed: false },
					{ label: "Cidade", completed: false },
					{ label: "Tipos de Evento", completed: false },
					{ label: "Gêneros Musicais", completed: false },
					{ label: "Tipos de Produção", completed: false },
					{ label: "Imagens do Portfólio", completed: false },
				],
			};
		}
		return {
			hasProduct: true,
			requirements: [
				{
					label: "Nome do Produto",
					completed: !!(product.nome && product.nome.trim()),
				},
				{
					label: "Descrição",
					completed: !!(product.descricao && product.descricao.trim()),
				},
				{
					label: "Foto de Perfil",
					completed: !!(product.fotoPerfil && product.fotoPerfil.trim()),
				},
				{
					label: "Logo",
					completed: !!(product.logomarca && product.logomarca.trim()),
				},
				{
					label: "CEP de Contato",
					completed: !!(product.cepContato && product.cepContato.trim()),
				},
				{
					label: "Endereço",
					completed: !!(
						product.logradouroContato && product.logradouroContato.trim()
					),
				},
				{
					label: "Número",
					completed: !!(product.numeroContato && product.numeroContato.trim()),
				},
				{
					label: "Cidade",
					completed: !!(product.cidadeContato && product.cidadeContato.trim()),
				},
				{
					label: "Estado",
					completed: !!(product.estadoContato && product.estadoContato.trim()),
				},
				{
					label: "Email",
					completed: !!(product.email && product.email.trim()),
				},
				{ label: "Categoria", completed: !!product.categoria?.id },
				{ label: "Cidade", completed: !!product.cidade?.id },
				{
					label: "Tipos de Evento",
					completed: !!(product.tipoEvento && product.tipoEvento.length > 0),
				},
				{
					label: "Gêneros Musicais",
					completed: !!(
						product.generoMusical && product.generoMusical.length > 0
					),
				},
				{
					label: "Tipos de Produção",
					completed: !!(
						product.tiposProducao && product.tiposProducao.length > 0
					),
				},
				{
					label: "Imagens do Portfólio",
					completed: !!(product.imagens && product.imagens.length > 0),
				},
			],
		};
	};

	const { hasProduct, requirements } = getProfileRequirements();
	const completedCount = requirements.filter((r) => r.completed).length;
	const totalCount = requirements.length;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<AlertTriangle className="h-6 w-6 text-orange-500" />
						<DialogTitle className="text-left">Perfil Incompleto</DialogTitle>
					</div>
					<DialogDescription className="text-left">
						Para enviar uma proposta, você precisa completar seu perfil de
						músico.
						{hasProduct && (
							<span className="block mt-2 text-sm">
								<strong>
									Progresso: {completedCount}/{totalCount} campos preenchidos
								</strong>
							</span>
						)}
					</DialogDescription>
				</DialogHeader>

				{/* Progress Bar */}
				{hasProduct && (
					<div className="mb-4">
						<div className="flex justify-between text-sm text-gray-600 mb-2">
							<span>Progresso do Perfil</span>
							<span>{Math.round((completedCount / totalCount) * 100)}%</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-orange-500 h-2 rounded-full transition-all duration-300"
								style={{ width: `${(completedCount / totalCount) * 100}%` }}
							></div>
						</div>
					</div>
				)}

				{/* Requirements List */}
				<div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
					<h4 className="font-medium text-sm text-gray-700 mb-3">
						{hasProduct ? "Campos obrigatórios:" : "Para começar:"}
					</h4>
					<div className="space-y-2">
						{requirements.slice(0, hasProduct ? 8 : 4).map((request, index) => (
							<div key={index} className="flex items-center gap-2 text-sm">
								{request.completed ? (
									<Check className="w-4 h-4 text-green-500" />
								) : (
									<X className="w-4 h-4 text-red-400" />
								)}
								<span
									className={
										request.completed ? "text-green-700" : "text-gray-600"
									}
								>
									{request.label}
								</span>
							</div>
						))}
						{requirements.length > (hasProduct ? 8 : 4) && (
							<p className="text-xs text-gray-500 mt-2">
								E mais {requirements.length - (hasProduct ? 8 : 4)} itens...
							</p>
						)}
					</div>
				</div>

				<div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
					<p className="text-sm text-orange-800">
						<strong>Por que isso é importante?</strong>
						<br />
						Um perfil completo aumenta suas chances de ser contratado, pois os
						contratantes podem ver todas as informações relevantes sobre sua
						banda.
					</p>
				</div>

				<DialogFooter className="flex-col gap-2 sm:flex-col">
					<Button onClick={handleCompleteProfile} className="w-full">
						Completar Meu Perfil
					</Button>
					<Button variant="outline" onClick={onClose} className="w-full">
						Cancelar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

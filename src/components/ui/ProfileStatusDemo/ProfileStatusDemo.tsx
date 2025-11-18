import { ProfileStatusBadge } from "../ProfileStatusBadge/ProfileStatusBadge";
import { useProfileStatus } from "../../../hooks/useProfileStatus";
import { Button } from "../Button/Button";

/**
 * Componente de demonstração do sistema de status de perfil
 * Este componente mostra como o sistema funciona na prática
 */
export const ProfileStatusDemo = () => {
	const {
		isProfileComplete,
		isProfileIncomplete,
		musicalProducts,
		isLoading,
		refetch
	} = useProfileStatus();

	const handleRefresh = async () => {
		await refetch();
	};

	return (
		<div className="p-6 bg-white rounded-lg border shadow-sm">
			<h3 className="text-lg font-semibold mb-4">Sistema de Status de Perfil - Demonstração</h3>

			{/* Status Badge */}
			<div className="mb-4">
				<ProfileStatusBadge size="lg" />
			</div>

			{/* Detailed Status */}
			<div className="space-y-3 mb-4">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">Status do Perfil:</span>
					<span className={`px-2 py-1 rounded text-xs font-medium ${
						isProfileComplete ? 'bg-green-100 text-green-800' :
						isProfileIncomplete ? 'bg-orange-100 text-orange-800' :
						'bg-gray-100 text-gray-800'
					}`}>
						{isProfileComplete ? 'COMPLETO' :
						 isProfileIncomplete ? 'INCOMPLETO' : 'CARREGANDO'}
					</span>
				</div>

				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">Produtos Musicais:</span>
					<span className="text-sm text-gray-600">
						{isLoading ? 'Carregando...' : (musicalProducts?.length || 0)}
					</span>
				</div>

				<div className="flex items-center justify-between">
					<span className="text-sm font-medium">Pode Enviar Propostas:</span>
					<span className={`text-sm font-medium ${
						isProfileComplete ? 'text-green-600' : 'text-red-600'
					}`}>
						{isProfileComplete ? 'SIM' : 'NÃO'}
					</span>
				</div>
			</div>

			{/* Action Button */}
			<Button
				onClick={handleRefresh}
				disabled={isLoading}
				size="sm"
				variant="outline"
				className="w-full"
			>
				{isLoading ? 'Atualizando...' : 'Atualizar Status'}
			</Button>

			{/* Instructions */}
			<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
				<p className="text-xs text-blue-800">
					<strong>Como testar:</strong>
					<br />
					1. Complete seu perfil musical no onboarding
					<br />
					2. Clique em "Atualizar Status" para ver mudanças
					<br />
					3. O status mudará automaticamente quando você publicar seu produto
				</p>
			</div>
		</div>
	);
};

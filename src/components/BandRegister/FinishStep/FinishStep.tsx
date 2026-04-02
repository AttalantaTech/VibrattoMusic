import { useState } from "react";
import { CheckboxField } from "../../forms/CheckBoxField/CheckBoxField";
import { Button } from "../../ui/Button/Button";
import { usePublishOnboarding } from "../../../hooks/useOnboarding";
import { useBandRegistration } from "../../../contexts/BandRegistrationContext";
import { useNavigate } from "@tanstack/react-router";
import { useProfileStatus } from "../../../hooks/useProfileStatus";
import { useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "../../../hooks/useProfileStatus";

interface FinishStepProps {
	productId?: number;
	onPrevious?: () => void;
	onComplete?: () => void;
}

export const FinishStep = ({
	productId,
	onPrevious,
	onComplete,
}: FinishStepProps) => {
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);
	const [isSkipping, setIsSkipping] = useState(false);
	const publishMutation = usePublishOnboarding();
	const { state } = useBandRegistration();
	const navigate = useNavigate();
	const { user } = useProfileStatus();
	const queryClient = useQueryClient();

	const handlePublish = async () => {
		if (!productId || !acceptedTerms) return;

		try {
			setIsPublishing(true);
			await publishMutation.mutateAsync(productId);

			// Invalidate profile cache to refresh profile status
			await queryClient.invalidateQueries({
				queryKey: profileKeys.musicalProducts(user?.id),
			});

			onComplete?.();
		} catch (error) {
			console.error("Error publishing musical product:", error);
		} finally {
			setIsPublishing(false);
		}
	};

	const handleSkipForNow = async () => {
		try {
			setIsSkipping(true);
			// For musicians who skip, redirect to band dashboard
			// Note: Backend should set profileStatus as 'INCOMPLETE' for skipped profiles
			await navigate({ to: "/band/dashboard" });
		} catch (error) {
			console.error("Error skipping registration:", error);
		} finally {
			setIsSkipping(false);
		}
	};

	const bandName = state.step2Data?.nome ?? "sua banda";

	return (
		<div className="flex flex-col w-full h-full gap-6">
			<div className="w-full flex flex-col gap-6">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-800 mb-2">
						Parabéns! Você está quase lá!
					</h1>
					<p className="text-gray-600">
						{bandName} está pronta para ser publicada na plataforma Vibratto.
					</p>
				</div>

				<div className="bg-gray-50 p-6 rounded-lg">
					<h2 className="text-lg font-semibold text-gray-700 mb-4">
						Resumo do Cadastro
					</h2>
					<div className="space-y-2 text-sm text-gray-600">
						<p>✓ Informações de contato preenchidas</p>
						<p>✓ Detalhes da banda configurados</p>
						<p>✓ Mídias e imagens adicionadas</p>
						<p>✓ Configurações técnicas definidas</p>
						<p>✓ Agenda configurada</p>
					</div>
				</div>

				<div className="w-full flex flex-col gap-4 text-gray-700">
					<h3 className="font-medium">Termos de Uso da Plataforma</h3>
					<p className="text-sm">
						Ao publicar na plataforma Vibratto, você concorda com os{" "}
						<span className="underline cursor-pointer text-primary-600">
							Termos de Uso
						</span>{" "}
						e{" "}
						<span className="underline cursor-pointer text-primary-600">
							Política de Privacidade
						</span>
						.
					</p>

					<CheckboxField
						checked={acceptedTerms}
						label="Aceito os Termos de Uso e Política de Privacidade"
						name="accept"
						onChange={(event) => {
							setAcceptedTerms(event.target.checked);
						}}
					/>
				</div>

				{publishMutation.isError && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
						Erro ao publicar a banda. Tente novamente.
					</div>
				)}
			</div>

			{/* Navigation buttons */}
			<div className="flex flex-col gap-4 pt-6">
				<div className="flex justify-between items-center">
					<Button
						disabled={isPublishing || isSkipping}
						type="button"
						variant="outline"
						onClick={onPrevious}
					>
						Anterior
					</Button>

					<Button
						disabled={
							!acceptedTerms ||
							isPublishing ||
							publishMutation.isPending ||
							isSkipping
						}
						variant="primary"
						onClick={handlePublish}
					>
						{isPublishing || publishMutation.isPending
							? "Publicando..."
							: "Publicar Banda"}
					</Button>
				</div>

				{/* Skip for now button */}
				<Button
					disabled={isPublishing || isSkipping || publishMutation.isPending}
					type="button"
					variant="transparent"
					className="w-full text-gray-600 hover:text-gray-800"
					onClick={handleSkipForNow}
				>
					{isSkipping ? "Pulando..." : "Pular por enquanto"}
				</Button>
			</div>
		</div>
	);
};

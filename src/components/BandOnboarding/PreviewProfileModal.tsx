import { Button } from "./../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { ProfileDetails } from "../BandProfile/Account/ProfileDetails";
import type { MusicalProduct } from "@/api/types";
import { toast } from "sonner";
import { useState } from "react";
import { onboardingService } from "@/api";
import { useQueryClient } from "@tanstack/react-query";
import { profileKeys, useProfileStatus } from "@/hooks/useProfileStatus";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

interface PreviewProfileModalProps {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
	musicalProduct: MusicalProduct;
	produtoMusicalId: number;
	allStepsCompleted: boolean;
}

export const PreviewProfileModal = ({
	isOpen,
	setIsOpen,
	musicalProduct,
	produtoMusicalId,
	allStepsCompleted,
}: PreviewProfileModalProps) => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const { user } = useProfileStatus();
	const { setNewProductCreated } = useMusicalProductStore();

	const [loading, setLoading] = useState(false);

	const handlePublish = async () => {
		if (!produtoMusicalId) {
			toast.error("Erro: ID do produto musical não encontrado");
			return;
		}

		if (!allStepsCompleted) {
			toast.warning("Atenção: Complete todos os passos antes de publicar");
			return;
		}

		setLoading(true);
		try {
			await onboardingService
				.publishOnboarding(Number(produtoMusicalId))
				.then(async (id) => {
					await queryClient.invalidateQueries({
						queryKey: profileKeys.musicalProducts({ userId: user?.id }),
					});

					setNewProductCreated(id);

					toast.success("Perfil Profissional publicado com Sucesso");

					await navigate({
						to: "/band/me",
						search: { tab: "account" },
					});
				});
		} catch (error: any) {
			console.error("Error publishing:", error);
			toast.error("Erro ao publicar produto musical");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-[900px] max-h-[85vh] overflow-auto">
				<DialogHeader>
					<DialogTitle title="Cria Perfil Profissional">
						Pré visualização do Perfil Profissional
					</DialogTitle>

					<DialogDescription />
				</DialogHeader>

				<ProfileDetails musicalProduct={musicalProduct} />

				<DialogFooter className="gap-2">
					<Button
						variant="secondary"
						onClick={() => {
							setIsOpen(false);
						}}
					>
						Cancelar
					</Button>

					<Button variant="primary" onClick={handlePublish}>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						<div className="flex items-center gap-1">
							{loading ? "Publicando..." : "Publicar"}
						</div>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

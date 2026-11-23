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
import { TERM_CODES } from "@/features/Terms/types";
import { useSignTerm, useTermStatus } from "@/features/Terms/hooks/useTerm";
import { needsAcceptance } from "@/features/Terms/utils/termStatus";
import { termErrorMessage } from "@/features/Terms/utils/termError";
import { TermsDialog } from "@/features/Terms/components/TermsDialog";

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
	// The publication term is accepted before publishing (only when the
	// current version isn't accepted yet)
	const publicationTerm = useTermStatus(
		TERM_CODES.publication,
		user?.id,
		isOpen
	);
	const signPublicationTerm = useSignTerm(TERM_CODES.publication, user?.id);
	const [isTermOpen, setIsTermOpen] = useState(false);
	const [termError, setTermError] = useState<string | null>(null);

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
						queryKey: profileKeys.musicalProducts(user?.id),
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

	const handlePublishClick = async () => {
		const term =
			publicationTerm.data === undefined
				? (await publicationTerm.refetch()).data
				: publicationTerm.data;
		if (needsAcceptance(term)) {
			setTermError(null);
			setIsTermOpen(true);
			return;
		}
		await handlePublish();
	};

	const termToAccept = needsAcceptance(publicationTerm.data)
		? publicationTerm.data
		: null;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-w-[900px] max-h-[85vh] overflow-auto">
				<DialogHeader>
					<DialogTitle title="Cria Perfil Profissional">
						Pré visualização do Perfil Profissional
					</DialogTitle>

					<DialogDescription />
				</DialogHeader>

				{/* ProfileDetails is loose sections with order classes meant for the
				    profile page. Straight in the dialog they were ordered after the
				    footer (Publicar/Cancelar showed on top) and, with no min-w-0, the
				    genres stretched it past the phone screen */}
				<div className="flex min-w-0 flex-col items-center gap-4 lg:gap-8">
					<ProfileDetails musicalProduct={musicalProduct} />
				</div>

				<DialogFooter className="gap-2">
					<Button
						variant="secondary"
						onClick={() => {
							setIsOpen(false);
						}}
					>
						Cancelar
					</Button>

					<Button
						variant="primary"
						disabled={loading}
						onClick={() => {
							void handlePublishClick();
						}}
					>
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						<div className="flex items-center gap-1">
							{loading ? "Publicando..." : "Publicar"}
						</div>
					</Button>
				</DialogFooter>
			</DialogContent>

			{termToAccept && (
				<TermsDialog
					isOpen={isTermOpen}
					code={TERM_CODES.publication}
					version={termToAccept.versao}
					html={termToAccept.texto ?? ""}
					isSigning={signPublicationTerm.isPending}
					error={termError}
					secondaryLabel="Cancelar"
					onSecondary={() => {
						setIsTermOpen(false);
					}}
					onAccept={() => {
						setTermError(null);
						signPublicationTerm.mutate(termToAccept.versao, {
							onSuccess: () => {
								setIsTermOpen(false);
								void handlePublish();
							},
							onError: (failure) => {
								setTermError(termErrorMessage(failure));
								void publicationTerm.refetch();
							},
						});
					}}
				/>
			)}
		</Dialog>
	);
};

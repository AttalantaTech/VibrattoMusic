import { useState } from "react";
import { useParams, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { MainLayout } from "../../components/layout/MainLayout";
import { Button } from "../../components/ui/Button/Button";
import {
	useSearchMusicalProducts,
	useMusicalProduct,
} from "../../hooks/useMusicalProducts";
import type { MusicalProductApiResponse } from "../../api/types";
import { StartConversationModal } from "../../components/BandProfile/Messages/components/StartConversationModal";
import { useStartConversation } from "../../hooks/useMessaging";
import { toast } from "sonner";
import { BandProfile } from "@/components/BandProfile/Account/BandProfile";

export const PublicBandProfile = () => {
	const { id } = useParams({ from: "/band/profile/$id" });
	const navigate = useNavigate();
	const router = useRouter();
	const [isConversationModalOpen, setIsConversationModalOpen] = useState(false);

	// Parse ID from URL parameter
	const bandId = Number(id);

	// Fetch band data
	const {
		data: bandList,
		isLoading: bandLoading,
		error,
	} = useMusicalProduct(bandId, bandId > 0 && !isNaN(bandId)) as {
		data: Array<MusicalProductApiResponse> | undefined;
		isLoading: boolean;
		error: any;
	};

	const band = bandList?.[0];

	// Search for similar artists
	const { data: similarArtists, isLoading: similarArtistsLoading } =
		useSearchMusicalProducts(
			{
				generosMusicais: band?.generoMusical?.map((g) => g.id) || [1, 2],
				limite: 4,
				ordenarPorAvaliacao: true,
				tamanhoPagina: 4,
				pagina: 1,
			},
			!!band
		);

	// Loading state
	if (bandLoading) {
		return (
			<MainLayout>
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Carregando perfil da banda...</p>
					</div>
				</div>
			</MainLayout>
		);
	}

	// Error state
	if (error || !band) {
		return (
			<MainLayout>
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Dados não encontrados
						</h2>
						<p className="text-gray-600 mb-4">
							Os dados da banda que você está procurando não foram encontrados.
						</p>
						<Button onClick={() => navigate({ to: "/" })}>
							Voltar para a página inicial
						</Button>
					</div>
				</div>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			{/* Back button */}
			<div className="w-full px-4 sm:px-6 lg:px-8 xl:px-14 pt-4">
				<Button
					variant="outline"
					onClick={() => {
						router.history.back();
					}}
					className="flex items-center gap-2"
				>
					<ArrowLeft size={16} />
					Voltar
				</Button>
			</div>

			<BandProfile
				bandLoading={bandLoading}
				musicalProduct={band}
				similarArtists={similarArtists}
				similarArtistsLoading={similarArtistsLoading}
			/>

			{/* Start Conversation Modal */}
			<StartConversationModal
				isOpen={isConversationModalOpen}
				onClose={() => {
					setIsConversationModalOpen(false);
				}}
				participantId={band.id}
				participantName={band.nome}
				onConversationStarted={() => {
					setIsConversationModalOpen(false);
					toast.success("Conversa iniciada com sucesso!");
					// Navigate to band me messages tab
					void navigate({ to: "/band/me", search: { tab: "messages" } });
				}}
			/>
		</MainLayout>
	);
};

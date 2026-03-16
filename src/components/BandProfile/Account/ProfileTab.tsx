import { Eye, Settings, Share } from "lucide-react";

import { Switch } from "../../ui/switch";
import { Label } from "../../ui/Label/Label";
import { Button } from "../../ui/Button/Button";
import { BandProfile } from "./BandProfile";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useState } from "react";
import { EditAccount } from "./EditAccount";
import { useSearchMusicalProducts } from "@/hooks/useMusicalProducts";
import { useUpdateMusicalProduct } from "@/hooks/useProfileStatus";
import { ShareLink } from "@/components/ui/ShareLink/ShareLink";

export const ProfileTab = () => {
	const { activeProduct, isLoadingMusicalProduct } = useMusicalProductStore();
	const updateMusicalProductMutation = useUpdateMusicalProduct();

	const [activeEditMode, setActiveEditMode] = useState<boolean>(false);
	const [openShare, setOpenShare] = useState<boolean>(false);

	const profileUrl =
		import.meta.env["VITE_VIBRATTO_FRONT_BASE_URL"] +
			`/band/profile/${activeProduct?.id}` || "";

	// Search for similar artists
	const { data: similarArtists, isLoading: similarArtistsLoading } =
		useSearchMusicalProducts(
			{
				generosMusicais: activeProduct?.generoMusical?.map((g) => g.id) || [
					1, 2,
				],
				limite: 4,
				ordenarPorAvaliacao: true,
				tamanhoPagina: 4,
				pagina: 1,
			},
			!!activeProduct
		);

	const handleActiveProfile = async (value: boolean) => {
		await updateMusicalProductMutation.mutateAsync({
			id: activeProduct?.id,
			ativo: value,
		});
	};

	const renderContent = () => {
		if (activeEditMode) {
			return <EditAccount />;
		} else {
			return (
				<BandProfile
					musicalProduct={activeProduct}
					bandLoading={isLoadingMusicalProduct}
					similarArtists={similarArtists}
					similarArtistsLoading={similarArtistsLoading}
				/>
			);
		}
	};

	return (
		<div className="w-full">
			{/* Header */}
			{activeProduct?.id ? (
				<div className="flex items-center justify-between max-w-7xl mx-auto gap-3 my-4 md:my-8">
					<h1 className="hidden text-gray-900 sm:block font-bold text-xl md:text-2xl w-full">
						Meu Perfil
					</h1>

					<div className="flex flex-col-reverse sm:flex-row w-full gap-3 items-center sm:items-center justify-end">
						{activeEditMode ? (
							<>
								<div className="flex items-center space-x-2">
									<Switch
										onCheckedChange={handleActiveProfile}
										checked={activeProduct?.ativo}
										id="active-profile"
									/>
									<Label htmlFor="airplane-mode">Perfil Ativo</Label>
								</div>

								<Button
									className="w-full sm:w-auto flex gap-2 py-4"
									onClick={() => {
										setActiveEditMode(false);
									}}
								>
									<Eye className="h-5 w-5 text-white" />
									<span className="block">Visualizar Perfil</span>
								</Button>
							</>
						) : (
							<>
								<Button
									variant="outline"
									className="w-full sm:w-auto flex gap-2 py-4 "
									onClick={() => {
										setOpenShare(true);
									}}
								>
									<Share className="h-5 w-5 text-gray-600" />
									<span className="block">Compartilhar</span>
								</Button>
								<Button
									variant="primary"
									className="w-full sm:w-auto flex gap-2 py-4 "
									onClick={() => {
										setActiveEditMode(true);
									}}
								>
									<Settings className="h-5 w-5 text-white" />
									<span className="block">Editar Perfil</span>
								</Button>
							</>
						)}
					</div>
				</div>
			) : null}

			<div className="flex flex-col-reverse flex-1 lg:flex-row gap-6 max-w-7xl mx-auto">
				{renderContent()}
			</div>

			<ShareLink
				open={openShare}
				onOpenChange={setOpenShare}
				url={profileUrl}
			/>
		</div>
	);
};

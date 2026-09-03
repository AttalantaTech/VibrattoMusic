import { FormProvider, useFieldArray } from "react-hook-form";
import { ChevronLeft, Loader2 } from "lucide-react";

import { AccountLayout } from "../../layout/AccountLayout/AccountLayout";

import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
// import { useUpdateMusicalProduct } from "@/hooks/useMusicalProducts";

import { useMediaForm } from "../MediaSection/hooks/useMediaForm";
import { useImageUpload } from "../MediaSection/hooks/useImageUpload";
import { useSocialNetworksData } from "../MediaSection/hooks/useSocialNetworks";
import { useMediaSubmit } from "../MediaSection/hooks/useMediaSubmit";
import { useMediaPreview } from "../MediaSection/hooks/useMediaPreview";

import { extractSpotifyResource } from "@/lib/utils/cn";

import { ProfileImageSection } from "../MediaSection/components/ProfileImageSection";
import { ClippingSection } from "../MediaSection/components/ClippingSection";
import { SocialNetworksSection } from "../MediaSection/components/SocialNetworksSection";
import { CarouselSection } from "../MediaSection/components/CarouselSection";
import { MainMediaSection } from "../MediaSection/components/MainMediaSection";
import { PriceSection } from "../MediaSection/components/PriceSection";

import { Image as ImageIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button/Button";

interface MediaSectionProps {
	onActiveSection: (section: string) => void;
}

export default function MediaSection({ onActiveSection }: MediaSectionProps) {
	const { activeProduct } = useMusicalProductStore();

	// FORM
	const { form } = useMediaForm(activeProduct);

	const { handleSubmit, watch } = form;

	// SOCIAL NETWORKS
	const {
		fields: socialFields,
		append: appendSocial,
		remove: removeSocial,
	} = useFieldArray({
		control: form.control,
		name: "redeSocial",
	});
	const { socialNetworks } = useSocialNetworksData();

	// IMAGE UPLOAD
	const {
		profilePhoto,
		carouselImages,
		uploadImage,
		removeImage,
		uploadingType,
		clippings,
		handleLegendImage,
		handleLegendClipping,
	} = useImageUpload({
		activeProductId: activeProduct?.id,
		initialProfilePhoto: activeProduct?.fotoPerfil,
		initialCarousel: activeProduct?.imagens,
		initialClipping: activeProduct?.clipagem,
	});

	// PREVIEW
	const { loadedItems, markAsLoaded } = useMediaPreview();

	// SUBMIT
	const { submit, loading } = useMediaSubmit({
		musicalProductId: activeProduct?.id,
		mode: "edit",
	});

	// SPOTIFY
	const spotifyPlaylistId = watch("spotifyPlaylistId");
	const spotifyResource = useMemo(() => {
		return extractSpotifyResource(spotifyPlaylistId || "");
	}, [spotifyPlaylistId]);

	const onSubmit = handleSubmit(async (data) => {
		await submit({
			youtubeUrl: data.videosYouTube?.[0] ?? "",
			spotifyUrl: data.spotifyPlaylistId ?? "",
			showPriceTab: data.exibirValorServico,
			redeSocial: data.redeSocial,
			valorServico: data.valorServico,
			profilePhoto,
			carouselImages,
			clippings,
		});
	});

	return (
		<AccountLayout
			headerIcon={<ImageIcon className="text-primary-700" size={24} />}
			headerTitle="Mídia Kit e Visibilidade"
		>
			<div className="flex flex-col w-full h-full gap-6 overflow-y-auto">
				<FormProvider {...form}>
					<form onSubmit={onSubmit} className="flex flex-col gap-6">
						{/* PROFILE IMAGE */}
						<ProfileImageSection
							image={profilePhoto}
							uploading={uploadingType === "ProdutoMusicalFotoPerfil"}
							onUpload={async (file) => {
								if (file) {
									await uploadImage(file, "ProdutoMusicalFotoPerfil");
								}
							}}
							onDelete={() => removeImage("ProdutoMusicalFotoPerfil")}
						/>

						{/* CLIPPINGS */}
						<ClippingSection
							clipping={clippings}
							onLegendClipping={handleLegendClipping}
							loadingMap={loadedItems}
							markAsLoaded={markAsLoaded}
							onUpload={async (file) => {
								if (file) {
									await uploadImage(file, "ProdutoMusicalClipagem");
								}
							}}
							onRemove={async (id: number | null, index: number) => {
								await removeImage("ProdutoMusicalClipagem", id, index);
							}}
						/>

						{/* SOCIAL NETWORKS */}
						<SocialNetworksSection
							control={form.control}
							errors={form.formState.errors}
							fields={socialFields}
							networks={socialNetworks}
							append={appendSocial}
							remove={removeSocial}
						/>

						{/* CAROUSEL */}
						<CarouselSection
							carousel={carouselImages}
							onLegendCarousel={handleLegendImage}
							loadingMap={loadedItems}
							markAsLoaded={markAsLoaded}
							onUpload={async (file) => {
								if (file) {
									await uploadImage(file, "ProdutoMusicalCarrossel");
								}
							}}
							onRemove={async (id: number | null, index: number) => {
								await removeImage("ProdutoMusicalCarrossel", id, index);
							}}
						/>

						{/* MAIN MEDIA */}
						<MainMediaSection
							youtubeUrl={form.watch("videosYouTube")?.[0] ?? ""}
							spotifyUrl={form.watch("spotifyPlaylistId") ?? ""}
							onYoutubeChange={(v) => {
								form.setValue("videosYouTube", [v]);
							}}
							onSpotifyChange={(v) => {
								form.setValue("spotifyPlaylistId", v);
							}}
							spotifyEmbed={
								spotifyResource
									? `https://open.spotify.com/embed/${spotifyResource.type}/${spotifyResource.id}`
									: null
							}
						/>

						{/* PRICE */}
						<PriceSection
							show={form.watch("exibirValorServico")}
							value={form.watch("valorServico") ?? ""}
							onToggle={(v) => {
								form.setValue("exibirValorServico", v);
							}}
							onChange={(v) => {
								form.setValue("valorServico", v);
							}}
						/>

						{/* ACTIONS */}
						<div className="flex flex-col sm:flex-row w-full gap-8 items-stretch sm:items-center justify-end mt-4 md:mt-6">
							<Button
								type="button"
								variant="secondary"
								className="w-full sm:w-auto"
								onClick={() => {
									onActiveSection("detail");
								}}
							>
								<div className="flex items-center gap-1">
									<ChevronLeft />
									Voltar
								</div>
							</Button>

							<Button
								type="submit"
								disabled={loading}
								className="w-full sm:w-auto"
							>
								{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

								<div className="flex items-center gap-1">
									{loading ? "Salvando..." : "Salvar"}
								</div>
							</Button>
						</div>
					</form>
				</FormProvider>
			</div>
		</AccountLayout>
	);
}

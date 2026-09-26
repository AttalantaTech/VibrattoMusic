import { useMemo } from "react";

import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import { FormProvider, useFieldArray } from "react-hook-form";
import { ChevronLeft, Loader2 } from "lucide-react";
import type { FilePropsLocal } from "@/api/types";

import { extractSpotifyResource } from "@/lib/utils/cn";
import { AccountLayout } from "../../layout/AccountLayout/AccountLayout";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

import { useMediaForm } from "@/features/MediaSection/hooks/useMediaForm";
import { useImageUpload } from "@/features/MediaSection/hooks/useImageUpload";
import { useSocialNetworksData } from "@/features/MediaSection/hooks/useSocialNetworks";
import { useMediaSubmit } from "@/features/MediaSection/hooks/useMediaSubmit";
import { useMediaPreview } from "@/features/MediaSection/hooks/useMediaPreview";

import { ProfileImageSection } from "@/features/MediaSection/components/ProfileImageSection";
import { ClippingSection } from "@/features/MediaSection/components/ClippingSection";
import { SocialNetworksSection } from "@/features/MediaSection/components/SocialNetworksSection";
import { CarouselSection } from "@/features/MediaSection/components/CarouselSection";
import { MainMediaSection } from "@/features/MediaSection/components/MainMediaSection";
import { PriceSection } from "@/features/MediaSection/components/PriceSection";

interface MediaSectionProps {
	onActiveSection: (section: string) => void;
}

export default function MediaSection({ onActiveSection }: MediaSectionProps) {
	const { activeProduct } = useMusicalProductStore();

	// FORM
	const { form } = useMediaForm(activeProduct);

	const { handleSubmit, watch } = form;

	// SPOTIFY
	const spotifyPlaylistId = watch("spotifyPlaylistId");
	const spotifyResource = useMemo(() => {
		return extractSpotifyResource(spotifyPlaylistId || "");
	}, [spotifyPlaylistId]);

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
	const {
		submit,
		loading,
		addProfilePhoto,
		addCarouselImage,
		addClippingFile,
	} = useMediaSubmit({
		musicalProductId: activeProduct?.id,
		mode: "edit",
	});

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

	const handleProfilePhoto = async (file: File | null) => {
		if (!file) return;

		const blobUrl = await uploadImage(file, "ProdutoMusicalFotoPerfil");

		await addProfilePhoto(blobUrl);
	};

	const handleUploadCarouselImage = async (file: File | null) => {
		if (!file) return;

		const blobUrl = await uploadImage(file, "ProdutoMusicalCarrossel");

		if (blobUrl) {
			const images: Array<FilePropsLocal> = [
				...carouselImages,
				{ id: null, link: blobUrl, legenda: "" },
			];

			await addCarouselImage(images);
		}
	};

	const handleUploadClipping = async (file: File | null) => {
		if (!file) return;
		const blobUrl = await uploadImage(file, "ProdutoMusicalClipagem");

		if (blobUrl) {
			const newClippings: Array<FilePropsLocal> = [
				...clippings,
				{ id: null, link: blobUrl, legenda: "" },
			];

			await addClippingFile(newClippings);
		}
	};

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
							onUpload={(file) => handleProfilePhoto(file)}
							onDelete={() => removeImage("ProdutoMusicalFotoPerfil")}
						/>

						{/* CAROUSEL */}
						<CarouselSection
							carousel={carouselImages}
							onLegendCarousel={handleLegendImage}
							loadingMap={loadedItems}
							markAsLoaded={markAsLoaded}
							onUpload={(file) => handleUploadCarouselImage(file)}
							onRemove={(id: number | null, index: number) =>
								removeImage("ProdutoMusicalCarrossel", id, index)
							}
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

						{/* CLIPPINGS */}
						<ClippingSection
							clipping={clippings}
							onLegendClipping={handleLegendClipping}
							loadingMap={loadedItems}
							markAsLoaded={markAsLoaded}
							onUpload={(file) => handleUploadClipping(file)}
							onRemove={(id: number | null, index: number) =>
								removeImage("ProdutoMusicalClipagem", id, index)
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

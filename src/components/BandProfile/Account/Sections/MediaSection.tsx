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
import { useMediaSubmit } from "@/features/MediaSection/hooks/useMediaSubmit";
import { useMediaPreview } from "@/features/MediaSection/hooks/useMediaPreview";

import { ProfileImageSection } from "@/features/MediaSection/components/ProfileImageSection";
import { ClippingSection } from "@/features/MediaSection/components/ClippingSection";
import { SocialNetworksSection } from "@/features/MediaSection/components/SocialNetworksSection";
import { CarouselSection } from "@/features/MediaSection/components/CarouselSection";
import { MainMediaSection } from "@/features/MediaSection/components/MainMediaSection";
import { PriceSection } from "@/features/MediaSection/components/PriceSection";
import {
	socialNetworkCatalog,
	useSocialNetworksData,
} from "@/features/MediaSection/hooks/useSocialNetworks";

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

	const { buildSocialUrl } = useSocialNetworksData();

	const onSubmit = handleSubmit(async (data) => {
		const socialNetworkFormatted =
			data.redeSocial
				?.map((item) => {
					const catalogItem = socialNetworkCatalog.find(
						(catalogItem) =>
							item.nomeRedeSocial.toLowerCase().trim() ===
							catalogItem.name.toLowerCase().trim()
					);

					if (!catalogItem) {
						return null;
					}

					return {
						idProdutoMusical: item.idProdutoMusical,
						idRedeSocial: item.idRedeSocial,
						nomeRedeSocial: item.nomeRedeSocial,
						link: buildSocialUrl(
							item.link,
							item.nomeRedeSocial,
							catalogItem.baseUrl
						),
					};
				})
				.filter((item) => item !== null) || [];

		await submit({
			youtubeUrl: data.videosYouTube?.[0] ?? "",
			spotifyUrl: data.spotifyPlaylistId ?? "",
			showPriceTab: data.exibirValorServico,
			redeSocial: socialNetworkFormatted,
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

	// Each save sends the whole list: uploading several files at once and
	// saving one by one would keep only the last, so the batch is saved once
	const uploadFiles = async (
		files: Array<File>,
		eventType: Parameters<typeof uploadImage>[1]
	) => {
		// In parallel; Promise.all keeps the selection order
		const uploaded = await Promise.all(
			files.map((file) => uploadImage(file, eventType))
		);
		const links = uploaded.filter((link): link is string => Boolean(link));

		return links.map(
			(link): FilePropsLocal => ({ id: null, link, legenda: "" })
		);
	};

	const handleUploadCarouselImage = async (files: Array<File>) => {
		const newImages = await uploadFiles(files, "ProdutoMusicalCarrossel");

		if (newImages.length > 0) {
			await addCarouselImage([...carouselImages, ...newImages]);
		}
	};

	const handleUploadClipping = async (files: Array<File>) => {
		const newClippings = await uploadFiles(files, "ProdutoMusicalClipagem");

		if (newClippings.length > 0) {
			await addClippingFile([...clippings, ...newClippings]);
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
							onUpload={handleUploadCarouselImage}
							onRemove={(id: number | null, index: number) =>
								removeImage("ProdutoMusicalCarrossel", id, index)
							}
						/>

						{/* SOCIAL NETWORKS */}
						<SocialNetworksSection
							control={form.control}
							errors={form.formState.errors}
							socialFields={socialFields}
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
							onUpload={handleUploadClipping}
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

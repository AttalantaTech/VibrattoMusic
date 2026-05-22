import { FormProvider, useFieldArray } from "react-hook-form";
import { ChevronLeft, Loader2 } from "lucide-react";

import { useMediaForm } from "../../BandProfile/Account/MediaSection/hooks/useMediaForm";
import { useImageUpload } from "../../BandProfile/Account/MediaSection/hooks/useImageUpload";
import { useSocialNetworksData } from "../../BandProfile/Account/MediaSection/hooks/useSocialNetworks";
import { useMediaSubmit } from "../../BandProfile/Account/MediaSection/hooks/useMediaSubmit";
import { useMediaPreview } from "../../BandProfile/Account/MediaSection/hooks/useMediaPreview";

import { extractSpotifyResource } from "@/lib/utils/cn";

import { ProfileImageSection } from "../../BandProfile/Account/MediaSection/components/ProfileImageSection";
import { ClippingSection } from "../../BandProfile/Account/MediaSection/components/ClippingSection";
import { SocialNetworksSection } from "../../BandProfile/Account/MediaSection/components/SocialNetworksSection";
import { CarouselSection } from "../../BandProfile/Account/MediaSection/components/CarouselSection";
import { MainMediaSection } from "../../BandProfile/Account/MediaSection/components/MainMediaSection";
import { PriceSection } from "../../BandProfile/Account/MediaSection/components/PriceSection";

import { Image as ImageIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/Button/Button";
import { useOnboardingData } from "@/hooks/useOnboarding";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { decryptValue } from "@/utils/encryptValue";
import type { OnboardingApiResponse } from "@/api/types";
import { StepLayout } from "../layout/StepLayout/StepLayout";

export default function MediaStep() {
	const navigate = useNavigate();
	const { data } = useOnboardingData();
	const searchParameters = useSearch({ from: "/band/register/onboarding/3" });

	const onboardingID = searchParameters.registerId
		? decryptValue(searchParameters.registerId ?? "")
		: null;
	const onboardingType = searchParameters.type ?? null;
	const onboardingData = useMemo<OnboardingApiResponse | undefined>(() => {
		if (!data?.length) return undefined;

		if (onboardingType === "new-onboarding") return undefined;

		if (onboardingID)
			return data.find((item) => item.id === Number(onboardingID));

		return data[0];
	}, [data, onboardingID, onboardingType]);

	// FORM
	const { form } = useMediaForm(onboardingData);

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
	} = useImageUpload({
		activeProductId: onboardingData?.id,
		initialProfilePhoto: onboardingData?.fotoPerfil,
		initialCarousel: onboardingData?.imagens,
		initialClipping: onboardingData?.clipagem,
	});

	// PREVIEW
	const { loadedItems, markAsLoaded } = useMediaPreview();

	// SUBMIT
	const { submit, loading } = useMediaSubmit({
		musicalProductId: onboardingData?.id,
		mode: "onboarding",
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
		<StepLayout
			currentStep={3}
			headerIcon={<ImageIcon className="text-primary-700" size={24} />}
			headerTitle="Mídia Kit e Visibilidade"
		>
			<div className="flex flex-col w-full h-full gap-6 overflow-y-auto">
				<FormProvider {...form}>
					<form onSubmit={onSubmit} className="flex flex-col gap-6">
						{/* PROFILE IMAGE */}
						<ProfileImageSection
							image={profilePhoto}
							uploading={uploadingType === "ProdutoMusicalOnboardingFotoPerfil"}
							onUpload={async (file) => {
								if (file) {
									await uploadImage(file, "ProdutoMusicalOnboardingFotoPerfil");
								}
							}}
							onDelete={() => removeImage("ProdutoMusicalOnboardingFotoPerfil")}
						/>

						{/* CLIPPINGS */}
						<ClippingSection
							clipping={clippings}
							markAsLoaded={markAsLoaded}
							loadingMap={loadedItems}
							onUpload={async (file) => {
								if (file) {
									await uploadImage(file, "ProdutoMusicalOnboardingClipagem");
								}
							}}
							onRemove={async (id: number | null, index: number) => {
								await removeImage(
									"ProdutoMusicalOnboardingClipagem",
									id,
									index
								);
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
									await uploadImage(file, "ProdutoMusicalOnboardingCarrossel");
								}
							}}
							onRemove={async (id: number | null, index: number) => {
								await removeImage(
									"ProdutoMusicalOnboardingCarrossel",
									id,
									index
								);
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
									void navigate({ to: "/band/register/onboarding/2" });
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
		</StepLayout>
	);
}

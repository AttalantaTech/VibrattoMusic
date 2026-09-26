import { useMemo } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { FormProvider, useFieldArray } from "react-hook-form";
import { ChevronLeft, Loader2 } from "lucide-react";
import { extractSpotifyResource } from "@/lib/utils/cn";

import { Button } from "@/components/ui/Button/Button";
import { useOnboardingData } from "@/hooks/useOnboarding";
import { decryptValue, encryptValue } from "@/utils/encryptValue";
import type {
	FileEventType,
	MusicalProductImages,
	OnboardingApiResponse,
} from "@/api/types";

import { StepLayout } from "../layout/StepLayout/StepLayout";

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
		activeProductId: onboardingData?.id,
		initialProfilePhoto: onboardingData?.fotoPerfil,
		initialCarousel: onboardingData?.imagens,
		initialClipping: onboardingData?.clipagem,
	});

	// PREVIEW
	const { loadedItems, markAsLoaded } = useMediaPreview();

	// SUBMIT
	const { submit, loading, addMediaOnboarding, addImageOnboarding } =
		useMediaSubmit({
			musicalProductId: onboardingData?.id,
			mode: "onboarding",
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

	const handleUploadImage = async (
		eventType: FileEventType,
		file: File | null
	) => {
		if (!file) return;

		const blobUrl = await uploadImage(file, eventType);

		if (blobUrl) {
			const imageData: MusicalProductImages =
				eventType === "ProdutoMusicalOnboardingFotoPerfil"
					? {
							FotoPerfil: blobUrl ?? null,
							ImagensCarrossel: carouselImages,
						}
					: {
							FotoPerfil: profilePhoto ?? null,
							ImagensCarrossel: [
								...carouselImages,
								{ link: blobUrl, legenda: "" },
							],
						};

			await addImageOnboarding({
				...imageData,
			});
		}
	};

	const handleUploadClipping = async (file: File | null) => {
		if (file) {
			const blobUrl = await uploadImage(
				file,
				"ProdutoMusicalOnboardingClipagem"
			);

			if (blobUrl) {
				const exibirValorServico = watch("exibirValorServico");
				const redeSocial = watch("redeSocial");
				const videosYouTube = watch("videosYouTube");
				const valor = watch("valorServico");

				const valorServico = exibirValorServico
					? valor
						? Number(valor)
						: null
					: null;

				await addMediaOnboarding({
					exibirValorServico,
					redeSocial: redeSocial || [],
					videosYouTube: videosYouTube || [],
					spotifyPlaylistId,
					valorServico,

					clipagem: [...clippings, { id: null, link: blobUrl, legenda: "" }],
				});
			}
		}
	};

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
							onUpload={(file) =>
								handleUploadImage("ProdutoMusicalOnboardingFotoPerfil", file)
							}
							onDelete={() => removeImage("ProdutoMusicalOnboardingFotoPerfil")}
						/>

						{/* CAROUSEL */}
						<CarouselSection
							carousel={carouselImages}
							onLegendCarousel={handleLegendImage}
							loadingMap={loadedItems}
							markAsLoaded={markAsLoaded}
							onUpload={(file) =>
								handleUploadImage("ProdutoMusicalOnboardingCarrossel", file)
							}
							onRemove={(id: number | null, index: number) =>
								removeImage("ProdutoMusicalOnboardingCarrossel", id, index)
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
								removeImage("ProdutoMusicalOnboardingClipagem", id, index)
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
								onClick={async () => {
									const search = onboardingData?.id
										? {
												registerId: encryptValue(onboardingData.id.toString()),
											}
										: {};

									await navigate({
										to: "/band/register/onboarding/2",
										search,
									});
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

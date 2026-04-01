import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
	Loader2,
	Plus,
	Trash2,
	Music,
	Image as ImageIcon,
	X,
	Eye,
	EyeOff,
	ChevronRight,
	ChevronLeft,
} from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import {
	FormField,
	FormItem,
	FormControl,
	FormMessage,
} from "../../ui/Form/Form";
import { onboardingService, imageUploadService } from "../../../api";
import { IconInput } from "../../forms/IconInput/IconInput";
import { IconTabNavigation } from "../../ui/IconTabNavigation/IconTabNavigation";
import { StepLayout } from "../layout/StepLayout/StepLayout";
import {
	FaInstagram,
	FaTiktok,
	FaSoundcloud,
	FaYoutube,
	FaFacebook,
	FaTwitter,
	FaLinkedin,
	FaSpotify,
	FaBandcamp,
} from "react-icons/fa";
import { SiApplemusic } from "react-icons/si";
import { Button } from "../../ui/Button/Button";
import type {
	FileEventType,
	FilePropsLocal,
	OnboardingApiResponse,
	RedeSocial,
} from "../../../api/types";
import { useOnboardingData } from "@/hooks/useMusicalProducts";
import { Label } from "@/components/ui/Label/Label";
import { Input } from "@/components/ui/Input/Input";
import { FileUploadBox } from "@/components/forms/FileUploadBox/FileUploadBox";
import { MediaPlayer } from "@/components/MediaPlayer/MediaPlayer";
import { ImageUploadArea } from "@/components/ImageUploadArea/ImageUploadArea";
import { toast } from "sonner";
import { useSocialNetworks } from "@/hooks/useFilters";
import { decryptValue } from "@/utils/encryptValue";

// Define media schema types
const mediaSchema = z.object({
	videosYouTube: z.array(z.string().url("URL inválida")).optional(),
	spotifyPlaylistId: z.string().optional(),
	exibirValorServico: z.boolean(),
	valorServico: z.string().nullable(),
	redeSocial: z
		.array(
			z
				.object({
					idRedeSocial: z.number(),
					link: z
						.string()
						.min(1, "O campo é obrigatório caso esteja visível")
						.url("URL inválida")
						.optional(),
					idProdutoMusical: z.number(),
					nomeRedeSocial: z.string(),
				})
				.optional()
		)
		.optional(),
	imagensCarrossel: z
		.array(
			z.object({
				id: z.number().nullable(),
				link: z.string(),
			})
		)
		.optional(),
});

// Interface for media data with default values
interface MediaData {
	videosYouTube?: Array<string>;
	spotifyPlaylistId?: string;
	redeSocial?: Array<RedeSocial>;
	fotoPerfil?: string | null;
	logomarca?: string | null;
	exibirValorServico: boolean;
	valorServico?: string | null;
	imagensCarrossel?: Array<{ id: number | null; link: string }>;
}

interface SocialNetworkList {
	idRedeSocial: number;
	name: string;
	icon: ReactNode;
	placeholder: string;
	link: string;
}

// Define social networks with their respective icons
interface SocialNetwork {
	name: string;
	placeholder: string;
	icon: ReactNode;
}

const styles = {
	titleText: "text-sm font-medium text-gray-700",
	sectionContainer: "bg-gray-50 py-6 border-b-2 border-gray-200",
	sectionHeader: "mb-4",
	sectionIcon: "text-primary-600",
	subtitle: "block text-gray-500 text-sm my-4",
};

const socialNetworkCatalog: Array<SocialNetwork> = [
	{
		name: "Instagram",
		placeholder: "https://instagram.com/seuperfil",
		icon: <FaInstagram color="#E4405F" size={24} />,
	},
	{
		name: "Facebook",
		placeholder: "https://facebook.com/suapagina",
		icon: <FaFacebook color="#1877F2" size={24} />,
	},
	{
		name: "Twitter/X",
		placeholder: "https://twitter.com/seuperfil",
		icon: <FaTwitter color="#1DA1F2" size={24} />,
	},
	{
		name: "TikTok",
		placeholder: "https://tiktok.com/@seuperfil",
		icon: <FaTiktok color="#000000" size={24} />,
	},
	{
		name: "LinkedIn",
		placeholder: "https://linkedin.com/in/seuperfil",
		icon: <FaLinkedin color="#0A66C2" size={24} />,
	},
	{
		name: "Spotify",
		placeholder: "https://open.spotify.com/artist/...",
		icon: <FaSpotify color="#1DB954" size={24} />,
	},
	{
		name: "Apple Music",
		placeholder: "https://music.apple.com/artist/...",
		icon: <SiApplemusic color="#FA243C" size={24} />,
	},
	{
		name: "Deezer",
		placeholder: "https://deezer.com/artist/...",
		icon: <Music color="#FF6D42" size={24} />,
	},
	{
		name: "YouTube",
		placeholder: "https://youtube.com/artist/...",
		icon: <FaYoutube color="#FA243C" size={24} />,
	},
	{
		name: "SoundCloud",
		placeholder: "https://soundcloud.com/artist/...",
		icon: <FaSoundcloud color="#FF5500" size={24} />,
	},
	{
		name: "Bandcamp",
		placeholder: "https://bandcamp.com/artist/...",
		icon: <FaBandcamp color="#1DA1F2" size={24} />,
	},
];

export default function MediaStep() {
	const navigate = useNavigate();
	const { updateData, markStepComplete } = useOnboarding();

	const { data: socialNetworksData } = useSocialNetworks(true);
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

	const produtoMusicalId = onboardingData ? onboardingData.id : 0;

	// Get initial media data from onboarding context
	const initialMediaData: MediaData = useMemo(() => {
		return {
			videosYouTube:
				onboardingData?.videosYouTube.map((item) => item.link) ?? [],
			spotifyPlaylistId: onboardingData?.spotifyPlaylistId ?? "",
			redeSocial: onboardingData?.redeSocial ?? [],
			fotoPerfil: onboardingData?.fotoPerfil ?? null,
			logomarca: onboardingData?.logomarca ?? null,
			valorServico: onboardingData?.valorServico?.toString() ?? null,
			exibirValorServico: onboardingData?.exibirValorServico ?? false,
			imagensCarrossel: onboardingData?.imagens ?? [],
		};
	}, [onboardingData]);

	const [loading, setLoading] = useState(false);
	const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
	// State for Step3-style UI
	const [currentMediaTab, setCurrentMediaTab] = useState<string>("youtube");
	const [youtubeUrl, setYoutubeUrl] = useState("");
	const [spotifyUrl, setSpotifyUrl] = useState<string | null>(null);

	const [showPriceTab, setShowPriceTab] = useState<boolean>(false);

	// Image states - initialize with existing data if available
	const [profilePhoto, setProfilePhoto] = useState<string | null>(
		initialMediaData.fotoPerfil || null
	);
	const [logoImage, setLogoImage] = useState<string | null>(
		initialMediaData.logomarca || null
	);
	const [carouselImages, setCarouselImages] = useState<
		Array<{ id: number | null; link: string }>
	>(onboardingData?.imagens || []);

	const [uploadingImage, setUploadingImage] = useState<string | null>(null);

	const [socialNetworkList, setSocialNetworkList] = useState<
		Array<SocialNetworkList>
	>([]);

	const form = useForm<MediaData>({
		resolver: zodResolver(mediaSchema),
		defaultValues: initialMediaData,
	});
	const { control, setValue, handleSubmit, register, reset, formState } = form;

	const {
		fields: socialFields,
		remove: removeSocial,
		append: appeendSocial,
	} = useFieldArray({
		control,
		name: "redeSocial",
	});

	const handleImageLoad = (link: string) => {
		setLoadedImages((previous) => ({
			...previous,
			[link]: true,
		}));
	};

	// Handle image upload using Azure Blob Storage
	const handleImageUpload = async (file: File, type: FileEventType) => {
		if (!produtoMusicalId) {
			toast.error("Onboarding não encontrado");

			return;
		}

		setUploadingImage(type);
		try {
			// Map the type to the correct evento name for the backend
			let evento: FileEventType;
			let idLista: number | undefined;

			if (type === "ProdutoMusicalOnboardingFotoPerfil") {
				evento = "ProdutoMusicalOnboardingFotoPerfil";
			} else if (type === "ProdutoMusicalOnboardingLogomarca") {
				evento = "ProdutoMusicalOnboardingLogomarca";
			} else {
				evento = "ProdutoMusicalOnboardingCarrossel";
				// For carousel images, use the current array length as the index
				idLista = carouselImages.length;
			}

			// If you have an image in Azure, it will delete it before you can upload a new image.
			if (
				evento === "ProdutoMusicalOnboardingFotoPerfil" &&
				onboardingData?.fotoPerfil
			) {
				await onboardingService.deleteImage({
					idCadastro: Number(produtoMusicalId),
					evento,
				});
			}

			if (
				evento === "ProdutoMusicalOnboardingLogomarca" &&
				onboardingData?.logomarca
			) {
				await onboardingService.deleteImage({
					idCadastro: Number(produtoMusicalId),
					evento,
				});
			}

			// Upload the image using the image upload service
			const blobUrl = await imageUploadService.uploadImage({
				file,
				evento,
				idCadastro: Number(produtoMusicalId),
				idLista,
			});

			// Update the state and form with the blob URL
			if (type === "ProdutoMusicalOnboardingFotoPerfil") {
				setProfilePhoto(blobUrl);
				setValue("fotoPerfil", blobUrl);
			} else if (type === "ProdutoMusicalOnboardingLogomarca") {
				setLogoImage(blobUrl);
				setValue("logomarca", blobUrl);
			} else if (type === "ProdutoMusicalOnboardingCarrossel") {
				const newImages = [...carouselImages, { id: null, link: blobUrl }];
				setCarouselImages(newImages);
			}
		} catch (error) {
			console.error("Erro ao fazer upload da imagem:", error);
			toast.error(
				error instanceof Error
					? `Erro ao fazer upload: ${error.message}`
					: "Erro ao fazer upload da imagem"
			);
		} finally {
			setUploadingImage(null);
		}
	};

	// Remove carousel image
	const removeCarouselImage = async (imgId: number | null, index: number) => {
		try {
			let newImages: Array<FilePropsLocal> = [];
			// Optionally delete the image from Azure Blob Storage
			if (imgId) {
				await onboardingService.deleteImage({
					idCadastro: Number(produtoMusicalId),
					evento: "ProdutoMusicalOnboardingCarrossel",
					idLista: imgId,
				});
				newImages = carouselImages.filter((img) => img.id !== imgId);
			} else {
				newImages = carouselImages.filter(
					(_, indexImage) => indexImage !== index
				);
			}

			setCarouselImages(newImages);
		} catch (error) {
			console.error("Erro ao remover imagem:", error);
		}
	};

	const removeImage = async (eventType: FileEventType) => {
		try {
			// It only makes a request to remove an image from Azure if it exists there.
			if (
				(eventType === "ProdutoMusicalOnboardingFotoPerfil" &&
					onboardingData?.fotoPerfil) ||
				(eventType === "ProdutoMusicalOnboardingLogomarca" &&
					onboardingData?.logomarca)
			) {
				await onboardingService.deleteImage({
					idCadastro: produtoMusicalId,
					evento: eventType,
				});
			}

			if (eventType === "ProdutoMusicalOnboardingFotoPerfil") {
				setProfilePhoto(null);
			}

			if (eventType === "ProdutoMusicalOnboardingLogomarca") {
				setLogoImage(null);
			}
		} catch (error) {
			console.error(error);
		}
	};

	const onSubmit = async (data: MediaData) => {
		if (!produtoMusicalId) {
			// TODO: Replace with proper toast system
			toast.error("ID do produto musical não encontrado");
			return;
		}

		setLoading(true);
		try {
			// Filter out empty YouTube URLs and structure data correctly for API
			const mediaData = {
				videosYouTube:
					data.videosYouTube?.filter((url: string) => url.trim() !== "") ?? [],
				spotifyPlaylistId: data.spotifyPlaylistId ?? null,
				exibirValorServico: showPriceTab, // Default value since we moved this to schedule
				valorServico: data.valorServico ? Number(data.valorServico) : null, // Default value since we moved this to schedule
				redeSocial: data.redeSocial ?? [],
			};

			// Save media data
			await onboardingService.updateMedia(Number(produtoMusicalId), mediaData);

			const imageData = {
				FotoPerfil: profilePhoto ?? null,
				Logomarca: logoImage ?? null,
				ImagensCarrossel: carouselImages.map((img) => img.link) ?? [],
			};

			// Save image data if there are any images
			if (
				(imageData.FotoPerfil &&
					imageData.FotoPerfil !== onboardingData?.fotoPerfil) ||
				(imageData.Logomarca &&
					imageData.Logomarca !== onboardingData?.logomarca) ||
				imageData.ImagensCarrossel.length > 0
			) {
				await onboardingService.updateImages(
					Number(produtoMusicalId),
					imageData
				);
			}

			updateData("media", data);
			markStepComplete("3");

			toast.success("Informações de Mídia e Visibilidade salvas com sucesso");

			await navigate({ to: "/band/register/onboarding/4" });
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error
					? error.message
					: ((error as any)?.response?.data?.mensagem ??
						"Erro ao salvar mídias");
			console.error("❌ Erro ao salvar mídias:", errorMessage);
			toast.error(String(errorMessage));
		} finally {
			setLoading(false);
		}
	};
	// Tab definitions for Step3-style UI
	const mediaTabs = [
		{
			label: "Vídeo",
			value: "youtube",
			icon: <FaYoutube size={20} />,
		},
		{
			label: "Áudio",
			value: "soundcloud",
			icon: <FaSoundcloud size={20} />,
		},
	];

	const displayCurrentMediaTab = () => {
		switch (currentMediaTab) {
			case "youtube":
				return (
					<>
						<IconInput
							className="w-full"
							icon={<FaYoutube color="#FF0000" size={24} />}
							name="youtubelink"
							placeholder="https://www.youtube.com/watch?v=..."
							value={youtubeUrl}
							onChange={setYoutubeUrl}
						/>
						{youtubeUrl ? (
							<div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg">
								<MediaPlayer src={youtubeUrl} />
							</div>
						) : (
							<div className="p-6 bg-gray-50 text-gray-500 rounded-lg flex flex-col items-center gap-3 text-center">
								<FaYoutube size={40} className="text-gray-400" />
								<p className="text-sm">
									Cole uma URL do YouTube acima para visualizar
								</p>
							</div>
						)}
					</>
				);
			case "soundcloud":
				return (
					<>
						<IconInput
							className="w-full"
							icon={<FaSoundcloud color="#FF5500" size={24} />}
							name="soundcloudlink"
							placeholder="https://soundcloud.com/..."
							value={spotifyUrl ?? ""}
							onChange={setSpotifyUrl}
						/>
						<div className="p-6 bg-gray-50 text-gray-500 rounded-lg flex flex-col items-center gap-3 text-center">
							<FaSoundcloud size={40} className="text-gray-400" />
							<p className="text-sm">Cole uma URL do SoundCloud acima</p>
						</div>
					</>
				);
			default:
				return null;
		}
	};

	// Update imagens
	useEffect(() => {
		setProfilePhoto(initialMediaData.fotoPerfil || null);
		setLogoImage(initialMediaData.logomarca || null);
		setCarouselImages(onboardingData?.imagens || []);

		if (initialMediaData.videosYouTube?.[0]) {
			setYoutubeUrl(initialMediaData.videosYouTube[0]);
		}
		if (initialMediaData.spotifyPlaylistId) {
			setSpotifyUrl(initialMediaData.spotifyPlaylistId);
		}

		setShowPriceTab(initialMediaData.exibirValorServico);

		reset(initialMediaData);
	}, [initialMediaData, onboardingData?.imagens, reset]);

	// Update form when state changes
	useEffect(() => {
		if (youtubeUrl) {
			setValue("videosYouTube", [youtubeUrl]);
		}
	}, [youtubeUrl, setValue]);

	useEffect(() => {
		if (spotifyUrl) {
			setValue("spotifyPlaylistId", spotifyUrl);
		}
	}, [spotifyUrl, setValue]);

	useEffect(() => {
		const mergedNetworks = socialNetworksData
			? socialNetworksData
					.map((apiItem) => {
						const catalogItem = socialNetworkCatalog.find(
							(c) =>
								c.name.toLowerCase().trim() ===
								apiItem.Nome.toLowerCase().trim()
						);

						if (!catalogItem) {
							return {
								idRedeSocial: apiItem.Id,
								name: apiItem.Nome,
								icon: "",
								placeholder: "",
								link: "",
							};
						}

						return {
							idRedeSocial: apiItem.Id,
							name: catalogItem.name,
							icon: catalogItem.icon,
							placeholder: catalogItem.placeholder,
							link: "",
						};
					})
					.filter(Boolean)
			: [];

		setSocialNetworkList(mergedNetworks);
	}, [socialNetworksData]);

	return (
		<StepLayout
			currentStep={3}
			headerIcon={<ImageIcon className="text-primary-700" size={24} />}
			headerTitle="Mídia Kit e Visibilidade"
		>
			<div className="flex flex-col w-full h-full gap-4 md:gap-6 overflow-y-auto">
				<FormProvider {...form}>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="flex flex-col w-full h-full gap-4 md:gap-6"
					>
						{/* Image section */}
						<div className={styles.sectionContainer}>
							<div className={styles.sectionHeader}>
								<h2 className={styles.titleText}>Imagens do Perfil</h2>
								<p className={styles.subtitle}>
									Adicione imagens que representem sua banda de forma
									profissional.
								</p>
							</div>

							{/* Main images */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
								<ImageUploadArea
									title="Foto de Perfil"
									description="JPG, PNG até 5MB"
									currentImage={profilePhoto}
									isUploading={
										uploadingImage === "ProdutoMusicalOnboardingFotoPerfil"
									}
									onDelete={async () => {
										await removeImage("ProdutoMusicalOnboardingFotoPerfil");
									}}
									onFileSelect={async (file) => {
										if (file)
											await handleImageUpload(
												file,
												"ProdutoMusicalOnboardingFotoPerfil"
											);
									}}
									aspectRatio="aspect-square"
								/>

								<ImageUploadArea
									title="Logomarca"
									description="JPG, PNG até 5MB"
									currentImage={logoImage}
									isUploading={
										uploadingImage === "ProdutoMusicalOnboardingLogomarca"
									}
									onDelete={async () => {
										await removeImage("ProdutoMusicalOnboardingLogomarca");
									}}
									onFileSelect={async (file) => {
										if (file)
											await handleImageUpload(
												file,
												"ProdutoMusicalOnboardingLogomarca"
											);
									}}
									aspectRatio="aspect-square"
								/>
							</div>
						</div>

						{/* Social media section */}
						<div className={styles.sectionContainer}>
							<div className={styles.sectionHeader}>
								<h2 className={styles.titleText}>Redes Sociais</h2>

								<span className={styles.subtitle}>
									Conecte suas redes sociais para aumentar sua visibilidade.
								</span>
							</div>

							<div className="space-y-3">
								{socialFields.map((field, index) => {
									const network = socialNetworkList.find(
										(n) => n.idRedeSocial === field.idRedeSocial
									);

									return (
										<div key={field.id} className="flex gap-2 items-start">
											<>
												<FormField
													control={control}
													name={`redeSocial.${index}.link`}
													render={({ field }) => (
														<FormItem className="flex-1 min-w-0">
															<FormControl>
																<IconInput
																	className="w-full"
																	icon={network?.icon}
																	name={`social.${index}.Link`}
																	placeholder={network?.placeholder ?? ""}
																	value={field.value ?? ""}
																	onChange={field.onChange}
																/>
															</FormControl>
															<p
																data-slot="form-message"
																className={"text-destructive text-sm"}
															/>
															{formState.errors.redeSocial &&
																formState.errors.redeSocial[index]?.message}
															<FormMessage />
														</FormItem>
													)}
												/>
												<Button
													type="button"
													variant="outline"
													className="h-10 w-10 p-0 flex items-center justify-center flex-shrink-0"
													onClick={() => {
														removeSocial(index);
													}}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</>
										</div>
									);
								})}

								<div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
									{socialNetworkList
										.filter(
											(n) =>
												!socialFields.some(
													(f) => f.idRedeSocial === n.idRedeSocial
												)
										)
										.map((network) => (
											<Button
												key={network.idRedeSocial}
												type="button"
												variant="secondary"
												className="flex items-center gap-2 text-xs sm:text-sm"
												onClick={() => {
													appeendSocial({
														idRedeSocial: network.idRedeSocial,
														link: "",
														idProdutoMusical: produtoMusicalId,
														nomeRedeSocial: network.name,
													});
												}}
											>
												<Plus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
												<span className="truncate">{network.name}</span>
											</Button>
										))}
								</div>
							</div>
						</div>

						{/* Image gallery section */}
						<div className={styles.sectionContainer}>
							<div className="space-y-4">
								<div className={styles.sectionHeader}>
									<h3 className={styles.titleText}>
										Carrossel de Imagens/Vídeos
									</h3>
									<span className={styles.subtitle}>
										A primeira imagem é definida como principal por padrão. Você
										pode alterar a ordem das imagens arrastando-as até a posição
										desejada
									</span>
								</div>

								<div>
									<FileUploadBox
										acceptedTypes={[
											"image/svg+xml",
											"image/png",
											"image/jpeg",
											"image/gif",
											"video/mp4",
										]}
										maxSizeMB={10}
										onFileSelected={async (file) => {
											if (file)
												await handleImageUpload(
													file,
													"ProdutoMusicalOnboardingCarrossel"
												);
										}}
									/>
								</div>

								{carouselImages.length > 0 && (
									<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
										{carouselImages.map((img, index) => (
											<div
												key={index}
												className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
											>
												<div className="relative w-full h-full">
													{!loadedImages[img.link] && (
														<div className="absolute inset-0 flex items-center justify-center bg-gray-100">
															<Loader2 className="w-5 h-5 animate-spin text-gray-400" />
														</div>
													)}

													<img
														src={img.link}
														alt={`Imagem ${index + 1}`}
														onLoad={() => {
															handleImageLoad(img.link);
														}}
														className={`w-full h-full object-cover transition-opacity duration-300 ${
															loadedImages[img.link]
																? "opacity-100"
																: "opacity-0"
														}`}
													/>
												</div>

												<button
													type="button"
													onClick={async () => {
														await removeCarouselImage(img.id, index);
													}}
													className="absolute top-1 right-1 bg-gray-400 hover:bg-gray-300  text-gray-800 rounded-full p-1 transition-colors"
												>
													<X className="w-3 h-3" />
												</button>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/*  Main media section */}
						<div className={styles.sectionContainer}>
							<div className={styles.sectionHeader}>
								<h2 className={styles.titleText}>Mídia Principal</h2>
							</div>
							<p className="text-gray-600 text-sm mb-4">
								Adicione um vídeo, áudio ou playlist para destacar seu trabalho.
							</p>
							<IconTabNavigation
								currentTab={currentMediaTab}
								tabs={mediaTabs}
								variant="default"
								onChange={setCurrentMediaTab}
							/>
							<div className="flex flex-col w-full gap-4 mt-4">
								{displayCurrentMediaTab()}
							</div>
						</div>

						{/* Price section*/}
						<div className={styles.sectionContainer}>
							<div className={styles.sectionHeader}>
								<h2 className={styles.titleText}>Valores e Orçamento</h2>
							</div>
							<p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
								Defina como os contratantes verão suas informações de valores.
							</p>

							{/* Tabs for price visibility */}
							<div className="mb-4">
								<IconTabNavigation
									currentTab={String(showPriceTab)}
									tabs={[
										{
											label: "Mostre o valor do serviço",
											value: "true",
											icon: <Eye size={20} />,
										},
										{
											label: "Valor mediante solicitação",
											value: "false",
											icon: <EyeOff size={20} />,
										},
									]}
									onChange={(event) => {
										setShowPriceTab(event === "false" ? false : true);
									}}
								/>
							</div>

							{/* Price input when showing price */}
							{showPriceTab && (
								<div className="space-y-2">
									<Label className="text-sm font-medium">
										Valor por evento
									</Label>
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											<span className="text-gray-500 text-sm font-medium">
												R$
											</span>
										</div>
										<Input
											type="number"
											placeholder="1.000,00"
											className="pl-10"
											{...register("valorServico")}
										/>
									</div>
									<p className="text-xs text-gray-500">
										Esse valor será exibido no seu perfil
									</p>
								</div>
							)}
						</div>

						{/* Navigation buttons */}
						<div className="flex flex-col sm:flex-row w-full gap-8 items-stretch sm:items-center justify-end mt-4 md:mt-6">
							<Button
								type="button"
								variant="outline"
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
									{loading ? "Salvando..." : "Continuar"}
									<ChevronRight />
								</div>
							</Button>
						</div>
					</form>
				</FormProvider>
			</div>
		</StepLayout>
	);
}

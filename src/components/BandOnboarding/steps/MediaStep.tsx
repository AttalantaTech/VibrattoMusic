import { useState } from "react";
import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// TODO: Implement proper toast system
// import { useToast } from "../../ui/use-toast";
import {
	Loader2,
	Plus,
	Trash2,
	Music,
	Share2,
	Camera,
	Image as ImageIcon,
	Upload,
	X,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import {
	Form,
	FormField,
	FormItem,
	FormControl,
	FormMessage,
} from "../../ui/Form/Form";
import { onboardingService, imageUploadService } from "../../../api";
import { IconInput } from "../../forms/IconInput/IconInput";
import { IconTabNavigation } from "../../ui/IconTabNavigation/IconTabNavigation";
import { StepLayout } from "../../BandRegister/layout/StepLayout/StepLayout";
import {
	FaInstagram,
	FaTiktok,
	FaSoundcloud,
	FaYoutube,
	FaFacebook,
	FaTwitter,
	FaLinkedin,
	FaSpotify,
} from "react-icons/fa";
import { SiApplemusic } from "react-icons/si";
import Youtube from "react-youtube";
import { extractYouTubeId } from "../../../lib/utils/cn";
import { Button } from "../../ui/Button/Button";

// Define media schema types
const mediaSchema = z.object({
	videosYouTube: z.array(z.string().url("URL inválida")).optional(),
	spotifyPlaylistId: z.string().optional(),
	appleMusicUrl: z.string().optional(),
	deezerUrl: z.string().optional(),
	redeSocial: z
		.array(
			z.object({
				idRedeSocial: z.number(),
				link: z.string().url("URL inválida"),
			})
		)
		.optional(),
	fotoPerfil: z.string().optional(),
	logomarca: z.string().optional(),
	imagensCarrossel: z.array(z.string()).optional(),
});

// TypeScript type for form data
type MediaFormValues = z.infer<typeof mediaSchema>;

// Interface for media data with default values
interface MediaData {
	videosYouTube?: Array<string>;
	spotifyPlaylistId?: string;
	appleMusicUrl?: string;
	deezerUrl?: string;
	redeSocial?: Array<{ idRedeSocial: number; link: string }>;
	fotoPerfil?: string;
	logomarca?: string;
	imagensCarrossel?: Array<string>;
}

const styles = {
	titleText: "text-gray-800 font-semibold text-lg",
	sectionContainer: "bg-gray-50 rounded-lg p-6 border border-gray-200",
	sectionTitle: "flex items-center gap-2 mb-4",
	sectionIcon: "text-blue-600",
};

// Define social networks with their respective icons
interface SocialNetwork {
	id: number;
	name: string;
	placeholder: string;
	icon: React.ReactNode;
}

const socialNetworks: Array<SocialNetwork> = [
	{
		id: 1,
		name: "Instagram",
		placeholder: "https://instagram.com/seuperfil",
		icon: <FaInstagram color="#E4405F" size={24} />,
	},
	{
		id: 2,
		name: "Facebook",
		placeholder: "https://facebook.com/suapagina",
		icon: <FaFacebook color="#1877F2" size={24} />,
	},
	{
		id: 3,
		name: "Twitter",
		placeholder: "https://twitter.com/seuperfil",
		icon: <FaTwitter color="#1DA1F2" size={24} />,
	},
	{
		id: 4,
		name: "TikTok",
		placeholder: "https://tiktok.com/@seuperfil",
		icon: <FaTiktok color="#000000" size={24} />,
	},
	{
		id: 5,
		name: "LinkedIn",
		placeholder: "https://linkedin.com/in/seuperfil",
		icon: <FaLinkedin color="#0A66C2" size={24} />,
	},
	{
		id: 6,
		name: "Spotify",
		placeholder: "https://open.spotify.com/artist/...",
		icon: <FaSpotify color="#1DB954" size={24} />,
	},
	{
		id: 7,
		name: "Apple Music",
		placeholder: "https://music.apple.com/artist/...",
		icon: <SiApplemusic color="#FA243C" size={24} />,
	},
	{
		id: 8,
		name: "Deezer",
		placeholder: "https://deezer.com/artist/...",
		icon: <Music color="#FF6D42" size={24} />,
	},
];

// Image upload component
interface ImageUploadAreaProps {
	onFileSelect: (file: File) => void;
	isUploading: boolean;
	currentImage?: string;
	title: string;
	description: string;
	aspectRatio?: string;
}

const ImageUploadArea = ({
	onFileSelect,
	isUploading,
	currentImage,
	title,
	description,
	aspectRatio = "aspect-square",
}: ImageUploadAreaProps) => {
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			onFileSelect(file);
		}
	};

	return (
		<div className="space-y-3">
			<div className="text-center">
				<h3 className="text-sm font-medium text-gray-900">{title}</h3>
				<p className="text-xs text-gray-500">{description}</p>
			</div>

			<div
				className={`relative ${aspectRatio} w-full border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors`}
			>
				{currentImage ? (
					<div className="relative w-full h-full">
						<img
							src={currentImage}
							alt={title}
							className="w-full h-full object-cover rounded-lg"
						/>
						<div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
							<label
								htmlFor={`upload-${title.toLowerCase().replace(" ", "-")}`}
								className="cursor-pointer bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-colors"
							>
								<Camera className="h-5 w-5 text-gray-700" />
							</label>
						</div>
					</div>
				) : (
					<label
						htmlFor={`upload-${title.toLowerCase().replace(" ", "-")}`}
						className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-500 transition-colors"
					>
						{isUploading ? (
							<Loader2 className="h-8 w-8 animate-spin" />
						) : (
							<>
								<Upload className="h-8 w-8 mb-2" />
								<span className="text-xs">Clique para adicionar</span>
							</>
						)}
					</label>
				)}
			</div>

			<input
				id={`upload-${title.toLowerCase().replace(" ", "-")}`}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
				disabled={isUploading}
			/>
		</div>
	);
};

export default function MediaStep() {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	// TODO: Implement proper toast system
	// const { toast } = useToast();
	const { updateData, markStepComplete, onboardingData, produtoMusicalId } =
		useOnboarding();

	// Get initial media data from onboarding context
	const initialMediaData: MediaData = onboardingData["media"] ?? {
		videosYouTube: [""],
		spotifyPlaylistId: "",
		appleMusicUrl: "",
		deezerUrl: "",
		redeSocial: [],
		fotoPerfil: "",
		logomarca: "",
		imagensCarrossel: [],
	};

	// State for Step3-style UI
	const [currentMediaTab, setCurrentMediaTab] = useState<string>("youtube");
	const [youtubeUrl, setYoutubeUrl] = useState("");
	const [spotifyUrl, setSpotifyUrl] = useState("");
	const [appleMusicUrl, setAppleMusicUrl] = useState("");
	const [deezerUrl, setDeezerUrl] = useState("");

	// Image states - initialize with existing data if available
	const [profilePhoto, setProfilePhoto] = useState<string>(
		initialMediaData.fotoPerfil || ""
	);
	const [logoImage, setLogoImage] = useState<string>(
		initialMediaData.logomarca || ""
	);
	const [carouselImages, setCarouselImages] = useState<Array<string>>(
		initialMediaData.imagensCarrossel || []
	);
	const [uploadingImage, setUploadingImage] = useState<string | null>(null);

	const form = useForm<MediaFormValues>({
		resolver: zodResolver(mediaSchema),
		defaultValues: initialMediaData,
	});
	const { fields: socialFields, remove: removeSocial } = useFieldArray({
		control: form.control,
		name: "redeSocial",
	});

	// Initialize media URLs from existing data on component mount
	// This ensures previously uploaded data is loaded when the user returns to this step
	React.useEffect(() => {
		if (initialMediaData.videosYouTube?.[0]) {
			setYoutubeUrl(initialMediaData.videosYouTube[0]);
		}
		if (initialMediaData.spotifyPlaylistId) {
			setSpotifyUrl(initialMediaData.spotifyPlaylistId);
		}
		if (initialMediaData.appleMusicUrl) {
			setAppleMusicUrl(initialMediaData.appleMusicUrl);
		}
		if (initialMediaData.deezerUrl) {
			setDeezerUrl(initialMediaData.deezerUrl);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Update form when state changes
	React.useEffect(() => {
		if (youtubeUrl) {
			form.setValue("videosYouTube", [youtubeUrl]);
		}
	}, [youtubeUrl, form]);

	React.useEffect(() => {
		if (spotifyUrl) {
			form.setValue("spotifyPlaylistId", spotifyUrl);
		}
	}, [spotifyUrl, form]);

	React.useEffect(() => {
		if (appleMusicUrl) {
			form.setValue("appleMusicUrl", appleMusicUrl);
		}
	}, [appleMusicUrl, form]);

	React.useEffect(() => {
		if (deezerUrl) {
			form.setValue("deezerUrl", deezerUrl);
		}
	}, [deezerUrl, form]);

	const videoId = extractYouTubeId(youtubeUrl);

	// Function to add a new social network field
	const addSocialNetwork = (networkId: number) => {
		const socialFields = form.getValues("redeSocial") || [];
		const newSocialField = {
			idRedeSocial: networkId,
			link: "",
		};
		form.setValue("redeSocial", [...socialFields, newSocialField]);
	};

	// Handle image upload using Azure Blob Storage
	const handleImageUpload = async (
		file: File,
		type: "fotoPerfil" | "logomarca" | "carrossel"
	) => {
		if (!produtoMusicalId) {
			alert("ID do produto musical não encontrado");
			return;
		}

		setUploadingImage(type);
		try {
			// Map the type to the correct evento name for the backend
			let evento: string;
			let idLista: number | undefined;
			
			if (type === "fotoPerfil") {
				evento = "fotoPerfil";
			} else if (type === "logomarca") {
				evento = "logomarca";
			} else {
				evento = "carrossel";
				// For carousel images, use the current array length as the index
				idLista = carouselImages.length;
			}

			// Upload the image using the image upload service
			const blobUrl = await imageUploadService.uploadImage({
				file,
				evento,
				idCadastro: Number(produtoMusicalId),
				idLista,
			});

			// Update the state and form with the blob URL
			if (type === "fotoPerfil") {
				setProfilePhoto(blobUrl);
				form.setValue("fotoPerfil", blobUrl);
			} else if (type === "logomarca") {
				setLogoImage(blobUrl);
				form.setValue("logomarca", blobUrl);
			} else if (type === "carrossel") {
				const newImages = [...carouselImages, blobUrl];
				setCarouselImages(newImages);
				form.setValue("imagensCarrossel", newImages);
			}
		} catch (error) {
			console.error("Erro ao fazer upload da imagem:", error);
			alert(
				error instanceof Error
					? `Erro ao fazer upload: ${error.message}`
					: "Erro ao fazer upload da imagem"
			);
		} finally {
			setUploadingImage(null);
		}
	};

	// Remove carousel image
	const removeCarouselImage = async (imageUrl: string) => {
		try {
			// Optionally delete the image from Azure Blob Storage
			// await imageUploadService.deleteImage(imageUrl);
			
			const newImages = carouselImages.filter((img) => img !== imageUrl);
			setCarouselImages(newImages);
			form.setValue("imagensCarrossel", newImages);
		} catch (error) {
			console.error("Erro ao remover imagem:", error);
		}
	};

	const onSubmit = async (data: MediaFormValues) => {
		if (!produtoMusicalId) {
			// TODO: Replace with proper toast system
			alert("ID do produto musical não encontrado");
			return;
		}

		setLoading(true);
		try {
			// Filter out empty YouTube URLs and structure data correctly for API
			const mediaData = {
				videosYouTube:
					data.videosYouTube?.filter((url: string) => url.trim() !== "") ?? [],
				spotifyPlaylistId: data.spotifyPlaylistId ?? "",
				appleMusicUrl: data.appleMusicUrl ?? "",
				deezerUrl: data.deezerUrl ?? "",
				exibirValorServico: false, // Default value since we moved this to schedule
				valorServico: 0, // Default value since we moved this to schedule
				redeSocial:
					data.redeSocial?.map((rs) => ({
						idRedeSocial: rs.idRedeSocial,
						link: rs.link,
					})) ?? [],
			};

			const imageData = {
				FotoPerfil: data.fotoPerfil ?? "",
				Logomarca: data.logomarca ?? "",
				ImagensCarrossel: data.imagensCarrossel ?? [],
			};

			// Save media data
			await onboardingService.updateMedia(Number(produtoMusicalId), mediaData);

			// Save image data if there are any images
			if (
				imageData.FotoPerfil ||
				imageData.Logomarca ||
				imageData.ImagensCarrossel.length > 0
			) {
				await onboardingService.updateImages(
					Number(produtoMusicalId),
					imageData
				);
			}

			updateData("media", data);
			markStepComplete("3");

			// TODO: Replace with proper toast system

			await navigate({ to: "/band/register/onboarding/4" });
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error
					? error.message
					: ((error as any)?.response?.data?.mensagem ??
						"Erro ao salvar mídias"); // TODO: Replace with proper toast system
			console.error("❌ Erro ao salvar mídias:", errorMessage);
			alert(errorMessage);
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
		{
			label: "Spotify",
			value: "spotify",
			icon: <FaSpotify size={20} />,
		},
		{
			label: "Apple Music",
			value: "applemusic",
			icon: <SiApplemusic size={20} />,
		},
		{
			label: "Deezer",
			value: "deezer",
			icon: <Music size={20} />,
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
						{videoId ? (
							<div className="w-full aspect-video rounded-lg overflow-hidden shadow-lg">
								<Youtube videoId={videoId} className="w-full h-full" />
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
							value={spotifyUrl}
							onChange={setSpotifyUrl}
						/>
						<div className="p-6 bg-gray-50 text-gray-500 rounded-lg flex flex-col items-center gap-3 text-center">
							<FaSoundcloud size={40} className="text-gray-400" />
							<p className="text-sm">Cole uma URL do SoundCloud acima</p>
						</div>
					</>
				);
			case "spotify":
				return (
					<>
						<IconInput
							className="w-full"
							icon={<FaSpotify color="#1DB954" size={24} />}
							name="spotifylink"
							placeholder="https://open.spotify.com/..."
							value={spotifyUrl}
							onChange={setSpotifyUrl}
						/>
						<div className="p-6 bg-gray-50 text-gray-500 rounded-lg flex flex-col items-center gap-3 text-center">
							<FaSpotify size={40} className="text-gray-400" />
							<p className="text-sm">
								Cole uma URL do Spotify (playlist ou álbum)
							</p>
						</div>
					</>
				);
			case "applemusic":
				return (
					<>
						<IconInput
							className="w-full"
							icon={<SiApplemusic color="#FA243C" size={24} />}
							name="applemusiclink"
							placeholder="https://music.apple.com/..."
							value={appleMusicUrl}
							onChange={setAppleMusicUrl}
						/>
						<div className="p-6 bg-gray-50 text-gray-500 rounded-lg flex flex-col items-center gap-3 text-center">
							<SiApplemusic size={40} className="text-gray-400" />
							<p className="text-sm">
								Cole uma URL do Apple Music (artista, álbum ou playlist)
							</p>
						</div>
					</>
				);
			case "deezer":
				return (
					<>
						<IconInput
							className="w-full"
							icon={<Music color="#FF6D42" size={24} />}
							name="deezerlink"
							placeholder="https://deezer.com/..."
							value={deezerUrl}
							onChange={setDeezerUrl}
						/>
						<div className="p-6 bg-gray-50 text-gray-500 rounded-lg flex flex-col items-center gap-3 text-center">
							<Music size={40} className="text-gray-400" />
							<p className="text-sm">
								Cole uma URL do Deezer (artista, álbum ou playlist)
							</p>
						</div>
					</>
				);
			default:
				return null;
		}
	};

	return (
		<StepLayout
			currentStep={3}
			headerIcon={<Music size={24} />}
			headerTitle="Mídia Kit e Visibilidade"
		>
			<div className="flex flex-col w-full h-full gap-4 md:gap-6 overflow-y-auto">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col w-full h-full gap-4 md:gap-6"
					>
						{/* Seção de Imagens */}
						<div className={styles.sectionContainer}>
							<div className={styles.sectionTitle}>
								<Camera className={styles.sectionIcon} size={24} />
								<h2 className={styles.titleText}>Imagens do Perfil</h2>
							</div>
							<p className="text-gray-600 text-sm mb-4">
								Adicione imagens que representem sua banda de forma
								profissional.
							</p>

							{/* Imagens principais */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
								<ImageUploadArea
									title="Foto de Perfil"
									description="JPG, PNG até 5MB"
									currentImage={profilePhoto}
									isUploading={uploadingImage === "fotoPerfil"}
									onFileSelect={(file) => handleImageUpload(file, "fotoPerfil")}
									aspectRatio="aspect-square"
								/>
								<ImageUploadArea
									title="Logomarca"
									description="JPG, PNG até 5MB"
									currentImage={logoImage}
									isUploading={uploadingImage === "logomarca"}
									onFileSelect={(file) => handleImageUpload(file, "logomarca")}
									aspectRatio="aspect-square"
								/>
							</div>

							{/* Galeria de imagens */}
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<ImageIcon className="text-purple-600" size={20} />
									<h3 className="text-base font-medium text-gray-900">
										Galeria de Imagens
									</h3>
								</div>

								{carouselImages.length > 0 && (
									<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
										{carouselImages.map((img, index) => (
											<div
												key={index}
												className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
											>
												<img
													src={img}
													alt={`Imagem ${index + 1}`}
													className="w-full h-full object-cover"
												/>
												<button
													type="button"
													onClick={() => {
														removeCarouselImage(img);
													}}
													className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
												>
													<X className="w-3 h-3" />
												</button>
											</div>
										))}
									</div>
								)}

								<div className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
									<label
										htmlFor="carousel-upload"
										className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 hover:text-gray-600"
									>
										{uploadingImage === "carrossel" ? (
											<Loader2 className="h-6 w-6 animate-spin" />
										) : (
											<>
												<Plus className="h-6 w-6" />
												<span className="text-sm">Adicionar à galeria</span>
											</>
										)}
									</label>
									<input
										id="carousel-upload"
										type="file"
										accept="image/*"
										onChange={(e) => {
											const file = e.target.files?.[0];
											if (file) handleImageUpload(file, "carrossel");
										}}
										className="hidden"
										disabled={uploadingImage === "carrossel"}
									/>
								</div>
							</div>
						</div>

						{/* Seção de Mídia Principal */}
						<div className={styles.sectionContainer}>
							<div className={styles.sectionTitle}>
								<Music className={styles.sectionIcon} size={24} />
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

						{/* Seção de Redes Sociais */}
						<div className={styles.sectionContainer}>
							<div className={styles.sectionTitle}>
								<Share2 className={styles.sectionIcon} size={24} />
								<h2 className={styles.titleText}>Redes Sociais</h2>
							</div>
							<p className="text-gray-600 text-sm mb-4">
								Conecte suas redes sociais para aumentar sua visibilidade.
							</p>
							<div className="space-y-3">
								{socialFields.map((field, index) => {
									const network = socialNetworks.find(
										(n) => n.id === field.idRedeSocial
									);
									return (
										<div key={field.id} className="flex gap-2 items-start">
											<FormField
												control={form.control}
												name={`redeSocial.${index}.link`}
												render={({ field }) => (
													<FormItem className="flex-1 min-w-0">
														<FormControl>
															<IconInput
																className="w-full"
																icon={network?.icon}
																name={`social-${index}`}
																placeholder={network?.placeholder ?? ""}
																value={field.value}
																onChange={field.onChange}
															/>
														</FormControl>
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
										</div>
									);
								})}

								<div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
									{socialNetworks
										.filter(
											(n) => !socialFields.some((f) => f.idRedeSocial === n.id)
										)
										.map((network) => (
											<Button
												key={network.id}
												type="button"
												variant="secondary"
												className="flex items-center gap-2 text-xs sm:text-sm"
												onClick={() => {
													addSocialNetwork(network.id);
												}}
											>
												<Plus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
												<span className="truncate">{network.name}</span>
											</Button>
										))}
								</div>
							</div>
						</div>

						{/* Navigation buttons */}
						<div className="flex flex-col sm:flex-row w-full gap-3 items-stretch sm:items-center justify-between mt-4 md:mt-6">
							<Button
								type="button"
								variant="outline"
								className="w-full sm:w-auto"
								onClick={() => {
									void navigate({ to: "/band/register/onboarding/2" });
								}}
							>
								Anterior
							</Button>

							<Button
								type="submit"
								disabled={loading}
								className="w-full sm:w-auto"
							>
								{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{loading ? "Salvando..." : "Próximo"}
							</Button>
						</div>
					</form>
				</Form>
			</div>
		</StepLayout>
	);
}

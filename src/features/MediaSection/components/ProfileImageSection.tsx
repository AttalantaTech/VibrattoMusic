import { ImageUploadArea } from "@/components/ImageUploadArea/ImageUploadArea";
import { MEDIA_STYLES } from "../constants/styles";
import { SectionHeader } from "./shared/SectionHeader";

type ProfileImageSectionProps = {
	image: string | null;
	uploading: boolean;
	onUpload: (file: File | null) => Promise<void>;
	onDelete: () => Promise<void>;
};

export function ProfileImageSection({
	image,
	onDelete,
	onUpload,
	uploading,
}: ProfileImageSectionProps) {
	return (
		<div className={MEDIA_STYLES.sectionContainer}>
			<SectionHeader
				title="Imagens do Perfil"
				subtitle="Adicione imagens que representem sua banda de forma profissional."
			/>

			{/* Main images */}
			<div className="flex flex-col items-center">
				<div className="max-w-[300px] w-full">
					{/* <div> */}
					<ImageUploadArea
						title="Foto de Perfil"
						description="JPG, PNG até 5MB"
						currentImage={image}
						isUploading={uploading}
						onDelete={onDelete}
						onFileSelect={onUpload}
						aspectRatio="aspect-square"
					/>
				</div>
			</div>
		</div>
	);
}

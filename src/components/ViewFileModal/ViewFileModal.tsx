import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/Button/Button";
import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import type { FileProps } from "@/api/types";
import { isEpsFile, isMP4File, isPdfFile } from "@/utils/validation";
import { EpsFilePreview } from "../cards/EpsFilePreview/EpsFilePreview";
import { PdfViewer } from "../PdfViewer/PdfViewer";
import { LazyImage } from "../ui/LazyImage/LazyImage";

/**
 * The video starts as soon as the viewer opens: the click on the thumbnail
 * already said "play". Browsers may refuse to start a video with sound by
 * itself (iPhone, mostly); then it starts muted, and the sound is one tap
 * away on its controls
 */
const ViewerVideo = ({ link }: { link: string }) => {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		video.play().catch(() => {
			video.muted = true;
			video.play().catch(() => undefined);
		});
	}, [link]);

	return (
		<video
			ref={videoRef}
			controls
			autoPlay
			playsInline
			preload="auto"
			className="w-full max-h-[70vh] rounded-md border border-gray-500 bg-black object-contain"
		>
			<source src={link} type="video/mp4" />
		</video>
	);
};

interface ViewFileModalProps {
	isOpen: boolean;
	setViewFile: Dispatch<
		SetStateAction<{ isOpen: boolean; file: FileProps | null }>
	>;
	file: FileProps | null;
}

export const ViewFileModal = ({
	isOpen,
	setViewFile,
	file,
}: ViewFileModalProps) => {
	if (!file) {
		return;
	}

	return (
		<Dialog
			open={isOpen}
			onOpenChange={() => {
				setViewFile({ isOpen: false, file: null });
			}}
		>
			<DialogContent className="w-full sm:max-w-sm md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Visualização do Arquivo</DialogTitle>
					<DialogDescription />
				</DialogHeader>

				{file.legenda && (
					<div className="my-8">
						<h4 className="text-gray-500 text-justify">{file.legenda}</h4>
					</div>
				)}

				<div className="flex flex-col w-full items-center">
					{isEpsFile(file.link) ? (
						<div className="w-full h-[60vh] max-h-[520px] rounded-md border border-gray-300 overflow-hidden">
							<EpsFilePreview link={file.link} showDownload />
						</div>
					) : isPdfFile(file.link) ? (
						<div className="w-full overflow-hidden rounded-md border border-gray-500">
							<PdfViewer
								key={file.id}
								title={file.legenda || "Arquivo PDF"}
								className="block h-[75vh] w-full"
								src={`${file.link}#toolbar=0`}
							/>
						</div>
					) : isMP4File(file.link) ? (
						<div className="w-full">
							<ViewerVideo key={file.link} link={file.link} />
						</div>
					) : (
						<LazyImage
							key={file.id}
							alt="Band clipping photo"
							className="rounded-lg w-full h-full object-cover"
							src={file.link}
						/>
					)}
				</div>

				<DialogFooter className="gap-2">
					<Button
						variant="secondary"
						onClick={() => {
							setViewFile({ isOpen: false, file: null });
						}}
					>
						Fechar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

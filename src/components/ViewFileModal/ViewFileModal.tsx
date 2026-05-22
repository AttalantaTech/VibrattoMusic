import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/Button/Button";
import type { Dispatch, SetStateAction } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";
import type { FileProps } from "@/api/types";
import { isMP4File, isPdfFile } from "@/utils/validation";
import { LazyImage } from "../ui/LazyImage/LazyImage";

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
					{isPdfFile(file.link) ? (
						<div className="max-w-[100vw] h-[75vh]">
							<embed
								key={file.id}
								className="w-full h-full rounded-md border border-gray-500"
								src={`${file.link}#toolbar=0`}
							/>
						</div>
					) : isMP4File(file.link) ? (
						<div className="w-full h-full">
							<video
								controls
								className="w-full h-full aspect-square rounded-md border border-gray-500"
							>
								<source src={file.link} type="video/mp4" />
							</video>
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

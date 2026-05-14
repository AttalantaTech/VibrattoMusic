import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/Button/Button";
import type { ReactNode } from "react";
import { DialogDescription } from "@radix-ui/react-dialog";

interface ViewStageMapModalProps {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
	children: ReactNode;
}

export const ViewStageMapModal = ({
	isOpen,
	setIsOpen,
	children,
}: ViewStageMapModalProps) => {
	return (
		<Dialog
			open={isOpen}
			onOpenChange={() => {
				setIsOpen(false);
			}}
		>
			<DialogContent className="max-w-[920px] w-[90vw] h-[90vh] overflow-hidden p-2">
				<DialogHeader>
					<DialogTitle>
						<span className="mt-8 pl-12 block">Visualizar Mapa de Palco</span>
					</DialogTitle>
					<DialogDescription />
				</DialogHeader>

				<div className="flex flex-col h-full overflow-auto">
					<div className="flex flex-col overflow-auto">{children}</div>

					<DialogFooter className="gap-2 sm:pr-0 lg:pr-12 sm:w-full">
						<Button
							className="sm:w-auto w-full"
							variant="secondary"
							onClick={() => {
								setIsOpen(false);
							}}
						>
							Fechar
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
};

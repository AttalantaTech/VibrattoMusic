import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button/Button";
import { SafeHtml } from "@/components/ui/SafeHtml/SafeHtml";
import { TERM_COPY, type TermCode } from "../types";

interface TermsDialogProps {
	isOpen: boolean;
	code: TermCode;
	version: number;
	/** The term in HTML, as registered in the API */
	html: string;
	isSigning: boolean;
	error: string | null;
	onAccept: () => void;
	/** "Sair da conta" (terms of use) or "Cancelar" (publication) */
	secondaryLabel: string;
	onSecondary: () => void;
	/**
	 * false: closes only through the buttons (terms of use: the platform
	 * can't be used without accepting)
	 */
	isDismissible?: boolean;
}

/**
 * The term to read and accept. "Aceitar" only works after checking "Li e
 * aceito"
 */
export const TermsDialog = ({
	isOpen,
	code,
	version,
	html,
	isSigning,
	error,
	onAccept,
	secondaryLabel,
	onSecondary,
	isDismissible = true,
}: TermsDialogProps) => {
	const [hasRead, setHasRead] = useState(false);
	const copy = TERM_COPY[code];

	// A new version (or opening again) asks for the check again
	useEffect(() => {
		if (isOpen) setHasRead(false);
	}, [isOpen, version]);

	const blockClosing = (event: Event) => {
		if (!isDismissible) event.preventDefault();
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open && isDismissible && !isSigning) onSecondary();
			}}
		>
			<DialogContent
				className={`w-full sm:max-w-2xl ${isDismissible ? "" : "[&>button.absolute]:hidden"}`}
				onEscapeKeyDown={blockClosing}
				onPointerDownOutside={blockClosing}
				onInteractOutside={blockClosing}
			>
				<DialogHeader>
					<DialogTitle>{copy.title}</DialogTitle>
					<DialogDescription>{copy.intro}</DialogDescription>
				</DialogHeader>

				<SafeHtml
					html={html}
					className="max-h-[45vh] overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800 [&_a]:text-primary-600 [&_a]:underline [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:mb-2 [&_ol]:list-decimal [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc"
				/>

				<label className="flex cursor-pointer items-start gap-2 text-sm text-gray-800">
					<input
						type="checkbox"
						className="mt-0.5 h-4 w-4 accent-primary-600"
						checked={hasRead}
						disabled={isSigning}
						onChange={(input) => {
							setHasRead(input.target.checked);
						}}
					/>
					<span>
						{copy.check}{" "}
						<span className="text-gray-500">(versão {version})</span>
					</span>
				</label>

				{error && (
					<p className="text-sm text-red-600" role="alert">
						{error}
					</p>
				)}

				<DialogFooter className="gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={isSigning}
						onClick={onSecondary}
					>
						{secondaryLabel}
					</Button>
					<Button
						type="button"
						className="flex gap-2"
						disabled={!hasRead || isSigning}
						onClick={onAccept}
					>
						{isSigning && (
							<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
						)}
						{isSigning ? "Aceitando..." : "Aceitar"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

import { useState } from "react";
import {
	Check,
	Copy,
	Download,
	Loader2,
	MessageCircle,
	Share2,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button/Button";
import type { ChecklistEvent, ChecklistItem } from "../types";
import { clientShareText } from "../utils/shareText";
import {
	buildChecklistPdf,
	checklistFileName,
	downloadFile,
	sharePdfFile,
	type PdfScope,
} from "../utils/checklistPdf";

interface ShareChecklistDialogProps {
	isOpen: boolean;
	event: ChecklistEvent;
	items: Array<ChecklistItem>;
	professional: string;
	onClose: () => void;
}

const openWhatsApp = (text: string) => {
	window.open(
		`https://wa.me/?text=${encodeURIComponent(text)}`,
		"_blank",
		"noopener"
	);
};

/**
 * The checklist as a PDF (downloaded or shared with the file attached) or
 * as a message. Until the back-end offers a page where the client checks
 * the items too
 */
export const ShareChecklistDialog = ({
	isOpen,
	event,
	items,
	professional,
	onClose,
}: ShareChecklistDialogProps) => {
	const [scope, setScope] = useState<PdfScope>("contratante");
	const [busy, setBusy] = useState<"download" | "share" | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);

	const hasClientItems = items.some((item) => item.group === "contratante");
	const canMakePdf = scope === "completo" || hasClientItems;
	const text = clientShareText(event, items, professional);
	const fileName = checklistFileName(event);
	const pdfMessage = `Olá${event.client ? `, ${event.client}` : ""}! Segue o checklist do evento de ${event.date.split("-").reverse().join("/")}.`;

	const makePdf = () =>
		buildChecklistPdf({ event, items, professional, scope });

	const handleDownload = async () => {
		setBusy("download");
		setNotice(null);
		try {
			downloadFile(await makePdf(), fileName);
		} catch {
			setNotice("Não foi possível gerar o PDF. Tente novamente.");
		} finally {
			setBusy(null);
		}
	};

	const handleShare = async () => {
		setBusy("share");
		setNotice(null);
		try {
			const pdf = await makePdf();
			const result = await sharePdfFile(pdf, fileName, pdfMessage);
			if (result === "unsupported") {
				// WhatsApp links carry text only: the file is attached by hand
				downloadFile(pdf, fileName);
				openWhatsApp(`${pdfMessage} (PDF em anexo)`);
				setNotice(
					"Este navegador não envia arquivos direto para o WhatsApp. O PDF foi baixado: é só anexá-lo na conversa que abriu."
				);
			}
		} catch {
			setNotice("Não foi possível gerar o PDF. Tente novamente.");
		} finally {
			setBusy(null);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					setIsCopied(false);
					setNotice(null);
					onClose();
				}
			}}
		>
			<DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Compartilhar checklist</DialogTitle>
					<DialogDescription>Envie em PDF ou como mensagem.</DialogDescription>
				</DialogHeader>

				<section className="flex flex-col gap-3">
					<h4 className="text-sm font-semibold text-gray-900">PDF</h4>
					<div
						className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm"
						role="radiogroup"
						aria-label="O que vai no PDF"
					>
						{(
							[
								["contratante", "Itens do contratante"],
								["completo", "Checklist completo"],
							] as const
						).map(([value, label]) => (
							<button
								key={value}
								type="button"
								role="radio"
								aria-checked={scope === value}
								className={`flex-1 rounded-md px-3 py-1.5 font-medium ${
									scope === value
										? "bg-white text-gray-900 shadow-sm"
										: "text-gray-600"
								}`}
								onClick={() => {
									setScope(value);
									setNotice(null);
								}}
							>
								{label}
							</button>
						))}
					</div>
					<p className="text-xs text-gray-500">
						{scope === "contratante"
							? 'Só o grupo "Com o contratante": o que ele precisa deixar pronto.'
							: "Todos os grupos, com o que já está pronto marcado. Bom para a sua equipe."}
					</p>

					{!canMakePdf && (
						<p className="rounded-md border border-dashed border-gray-300 p-3 text-center text-sm text-gray-600">
							Este evento não tem itens no grupo "Com o contratante".
						</p>
					)}

					<div className="flex flex-col gap-2 sm:flex-row">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="flex flex-1 gap-2"
							disabled={!canMakePdf || busy !== null}
							onClick={() => {
								void handleDownload();
							}}
						>
							{busy === "download" ? (
								<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
							) : (
								<Download className="h-4 w-4" aria-hidden="true" />
							)}
							Baixar PDF
						</Button>
						<Button
							type="button"
							size="sm"
							className="flex flex-1 gap-2"
							disabled={!canMakePdf || busy !== null}
							onClick={() => {
								void handleShare();
							}}
						>
							{busy === "share" ? (
								<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
							) : (
								<Share2 className="h-4 w-4" aria-hidden="true" />
							)}
							Enviar PDF
						</Button>
					</div>

					<p className="text-xs text-gray-500">
						"Enviar PDF" abre o compartilhar do aparelho, onde aparece o
						WhatsApp com o arquivo anexado.
					</p>

					{notice && (
						<p
							className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800"
							role="status"
						>
							{notice}
						</p>
					)}
				</section>

				<section className="mt-2 flex flex-col gap-3 border-t border-gray-100 pt-4">
					<h4 className="text-sm font-semibold text-gray-900">Mensagem</h4>
					{hasClientItems ? (
						<pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-3 font-sans text-sm text-gray-800">
							{text}
						</pre>
					) : (
						<p className="text-sm text-gray-600">
							Inclua itens no grupo "Com o contratante" para enviar a mensagem.
						</p>
					)}
					<div className="flex flex-col gap-2 sm:flex-row">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="flex flex-1 gap-2"
							disabled={!hasClientItems}
							onClick={() => {
								void navigator.clipboard.writeText(text).then(() => {
									setIsCopied(true);
								});
							}}
						>
							{isCopied ? (
								<Check className="h-4 w-4" aria-hidden="true" />
							) : (
								<Copy className="h-4 w-4" aria-hidden="true" />
							)}
							{isCopied ? "Copiado" : "Copiar texto"}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="flex flex-1 gap-2"
							disabled={!hasClientItems}
							onClick={() => {
								openWhatsApp(text);
							}}
						>
							<MessageCircle className="h-4 w-4" aria-hidden="true" />
							Enviar no WhatsApp
						</Button>
					</div>
				</section>
			</DialogContent>
		</Dialog>
	);
};

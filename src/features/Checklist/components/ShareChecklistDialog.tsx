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
import type {
	Branding,
	ChecklistEvent,
	ChecklistItem,
	ScheduleRow,
} from "../types";
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
	branding: Branding;
	/** The band's logo; null: the PDF goes without one */
	logo: string | null;
	schedule: Array<ScheduleRow>;
	audience: string;
	notes: string;
	/** The day's forecast as text, when there is one */
	weather: { text: string; symbol?: string } | null;
	onClose: () => void;
	/** Opens "Personalizar PDF" */
	onCustomize: () => void;
}

const SCOPES: Array<{ value: PdfScope; label: string; hint: string }> = [
	{
		value: "equipe",
		label: "Cronograma da equipe",
		hint: "Horários, transporte, público e informações importantes, para a banda e a produção.",
	},
	{
		value: "contratante",
		label: "Itens do contratante",
		hint: 'Só o grupo "Com o contratante": o que ele precisa deixar pronto.',
	},
	{
		value: "completo",
		label: "Checklist completo",
		hint: "Todos os grupos, com o que já está pronto marcado.",
	},
];

const openWhatsApp = (text: string) => {
	window.open(
		`https://wa.me/?text=${encodeURIComponent(text)}`,
		"_blank",
		"noopener"
	);
};

/**
 * The event as a PDF (downloaded or shared with the file attached) or as a
 * message. Until the back-end offers a page where the client checks the
 * items too
 */
export const ShareChecklistDialog = ({
	isOpen,
	event,
	items,
	professional,
	branding,
	logo,
	schedule,
	audience,
	notes,
	weather,
	onClose,
	onCustomize,
}: ShareChecklistDialogProps) => {
	const [scope, setScope] = useState<PdfScope>("equipe");
	const [includeItems, setIncludeItems] = useState(false);
	const [busy, setBusy] = useState<"download" | "share" | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);

	const hasClientItems = items.some((item) => item.group === "contratante");
	const canMakePdf = scope !== "contratante" || hasClientItems;
	const text = clientShareText(event, items, professional);
	const fileName = checklistFileName(event, scope);
	const dayMonth = event.date.split("-").reverse().join("/");
	const pdfMessage =
		scope === "equipe"
			? `Cronograma do evento de ${dayMonth}.`
			: `Olá${event.client ? `, ${event.client}` : ""}! Segue o checklist do evento de ${dayMonth}.`;

	const makePdf = () =>
		buildChecklistPdf({
			event,
			items,
			professional,
			scope,
			branding,
			logo,
			schedule,
			audience,
			notes,
			includeItems,
			weather,
		});

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
					<DialogTitle>Compartilhar</DialogTitle>
					<DialogDescription>Envie em PDF ou como mensagem.</DialogDescription>
				</DialogHeader>

				<section className="flex flex-col gap-3">
					<h4 className="text-sm font-semibold text-gray-900">PDF</h4>
					<div
						className="flex flex-col gap-1.5"
						role="radiogroup"
						aria-label="Qual PDF"
					>
						{SCOPES.map((option) => (
							<label
								key={option.value}
								className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
									scope === option.value
										? "border-primary-400 bg-primary-50"
										: "border-gray-200 hover:border-gray-300"
								}`}
							>
								<input
									type="radio"
									name="pdf-scope"
									className="mt-1 accent-primary-600"
									checked={scope === option.value}
									onChange={() => {
										setScope(option.value);
										setNotice(null);
									}}
								/>
								<span>
									<span className="block text-sm font-medium text-gray-900">
										{option.label}
									</span>
									<span className="block text-xs text-gray-500">
										{option.hint}
									</span>
								</span>
							</label>
						))}
					</div>

					{scope === "equipe" && (
						<label className="flex items-center gap-2 text-sm text-gray-700">
							<input
								type="checkbox"
								className="accent-primary-600"
								checked={includeItems}
								onChange={(input) => {
									setIncludeItems(input.target.checked);
								}}
							/>
							Incluir também os itens do checklist
						</label>
					)}

					{!canMakePdf && (
						<p className="rounded-md border border-dashed border-gray-300 p-3 text-center text-sm text-gray-600">
							Este evento não tem itens no grupo "Com o contratante".
						</p>
					)}

					{!logo && (
						<p className="text-xs text-gray-500">
							O PDF vai sem logo.{" "}
							<button
								type="button"
								className="font-medium text-primary-600 hover:underline"
								onClick={onCustomize}
							>
								Adicione o logo da banda em "Personalizar PDF"
							</button>
							.
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
					<h4 className="text-sm font-semibold text-gray-900">
						Mensagem para o contratante
					</h4>
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

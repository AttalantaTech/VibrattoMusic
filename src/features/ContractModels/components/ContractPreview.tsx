import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ContractModel } from "../types";
import { fillExample, toScreenText } from "../utils/markers";

interface ContractPreviewProps {
	model: ContractModel | null;
	onClose: () => void;
}

/**
 * The contract as the client will read it. The automatic data (names,
 * date, place, value) is filled with an example: in a real proposal the
 * system puts the proposal's data there
 */
export const ContractPreview = ({ model, onClose }: ContractPreviewProps) => (
	<Dialog
		open={!!model}
		onOpenChange={(open) => {
			if (!open) onClose();
		}}
	>
		<DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-3xl">
			<DialogHeader>
				<DialogTitle>{model?.nome}</DialogTitle>
				<DialogDescription>
					Prévia com dados de exemplo. Na proposta, os nomes, a data, o local e
					o valor saem da própria proposta.
				</DialogDescription>
			</DialogHeader>

			<article className="flex flex-col gap-5 rounded-md border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-800 sm:p-8">
				<h3 className="text-center text-base font-bold uppercase">
					Contrato de prestação de serviços artísticos
				</h3>
				{[...(model?.secoes ?? [])]
					.sort((a, b) => a.numero - b.numero)
					.map((section) => (
						<section key={section.id}>
							{section.numero > 0 && (
								<h4 className="mb-1 font-bold">{section.titulo}</h4>
							)}
							<p className="whitespace-pre-line text-justify">
								{fillExample(toScreenText(section.texto))}
							</p>
						</section>
					))}
			</article>
		</DialogContent>
	</Dialog>
);

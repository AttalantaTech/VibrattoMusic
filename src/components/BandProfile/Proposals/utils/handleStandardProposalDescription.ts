import { formatDocument } from "@/utils/validation";

interface StandardProposalDescription {
	category: string;
	legalName: string;
	document: string;
	artisticName: string;
}

export function handleStandardProposalDescription({
	category,
	document,
	legalName,
	artisticName,
}: StandardProposalDescription) {
	const formattedDocument = formatDocument(document);

	// The field is editable now: no trailing line break/spaces after the text
	return `Conforme solicitação, segue proposta orçamentária para contratação da apresentação artística da(o) ${category} - ${artisticName}, neste ato representada por ${legalName}, inscrita no CPF/CNPJ ${formattedDocument}`;
}

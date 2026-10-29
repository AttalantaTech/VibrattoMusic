import type { MusicalProduct, UserApiResponse } from "@/api/types";
import { formatDocument, validateCPF } from "@/utils/validation";

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

/**
 * Who answers for the act in the standard description. A CNPJ profile is the
 * company; otherwise a person, decided like the contact form does: the user
 * when registered with a CPF, or the account's legal representative when the
 * account is a company. It used the legal representative even for a CPF
 * account, which is empty there, so the text read "representada por -".
 */
export const proposalLegalParty = ({
	product,
	user,
}: {
	product: Pick<MusicalProduct, "usaCnpj" | "cnpj" | "razaoSocial">;
	user:
		| Pick<
				UserApiResponse,
				"nome" | "cpfOuCnpj" | "nomeResponsavelLegal" | "cpfResponsavelLegal"
		  >
		| null
		| undefined;
}) => {
	if (product.usaCnpj) {
		return {
			legalName: product.razaoSocial || "-",
			document: product.cnpj || "-",
		};
	}

	const isCPF = validateCPF(user?.cpfOuCnpj || "");
	return {
		legalName: (isCPF ? user?.nome : user?.nomeResponsavelLegal) || "-",
		document: (isCPF ? user?.cpfOuCnpj : user?.cpfResponsavelLegal) || "-",
	};
};

const STANDARD_TEXT =
	/^Conforme solicitação, segue proposta orçamentária[\s\S]*?inscrita no CPF\/CNPJ[ \t]*[\d./-]*/;

/**
 * The part of `descricao` the professional typed. The standard text is no
 * longer saved (the PDF prints it on its own), but older proposals have it
 * at the start of `descricao`, sometimes followed by extra text.
 */
export const descriptionComplement = (descricao?: string | null): string =>
	(descricao ?? "")
		.trim()
		.replace(STANDARD_TEXT, "")
		// What followed the standard text started with its final punctuation
		.replace(/^[\s.,;:-]+/, "")
		.trim();

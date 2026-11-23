/**
 * The terms the person accepts (back-end by Cunha, 11/2026). The code goes in
 * the address: GET termoAceite/{code}, POST termoAceite/{code}/assinar
 */
export const TERM_CODES = {
	/** Everyone with an account (client and professional) */
	use: "TERMOS_USO",
	/** Before publishing a professional profile */
	publication: "PUBLICACAOPRODUTOMUSICAL",
} as const;

export type TermCode = (typeof TERM_CODES)[keyof typeof TERM_CODES];

/**
 * What GET termoAceite/{code} answers. Already accepted: only
 * { assinado: true }. Not accepted (or a new version): the version to accept
 * and its text, in HTML
 */
export interface TermStatus {
	assinado: boolean;
	versao?: number;
	texto?: string;
}

/** The words of the dialog for each term */
export const TERM_COPY: Record<
	TermCode,
	{ title: string; check: string; intro: string }
> = {
	TERMOS_USO: {
		title: "Termos de uso da Vibratto",
		intro: "Para continuar usando a Vibratto, leia e aceite os termos de uso.",
		check: "Li e aceito os termos de uso",
	},
	PUBLICACAOPRODUTOMUSICAL: {
		title: "Termo de publicação do perfil profissional",
		intro:
			"Antes de publicar o seu perfil, leia e aceite o termo de publicação.",
		check: "Li e aceito o termo de publicação",
	},
};

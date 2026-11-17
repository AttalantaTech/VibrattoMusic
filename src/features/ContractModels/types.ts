/**
 * Contract models of a professional profile (Cunha's API, nov/2026):
 * copies of Vibratto's base contract, where only the sections marked
 * "editavel" can change
 */

/** produtomusical/{id}/modelosContrato */
export interface ContractModelSummary {
	id: number;
	nome: string;
	/** Chosen by default when sending a proposal */
	padrao: boolean;
}

export interface ContractModelSection {
	id: number;
	/** Order in the contract; 0 is the introduction */
	numero: number;
	titulo: string;
	/** May carry markers like [Proposta.Local], filled in by the back-end */
	texto: string;
	/** false: written by Vibratto, can't change */
	editavel: boolean;
}

/** produtomusical/modeloContrato/{id} (GET and PUT) */
export interface ContractModel {
	id: number;
	nome: string;
	secoes: Array<ContractModelSection>;
}

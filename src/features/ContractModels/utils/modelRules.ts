import type { ContractModel, ContractModelSection } from "../types";
import { isNewClause, renumber } from "./clauseOrder";

/**
 * What goes to the API when saving: the screen's order and the edited
 * title and text of editable clauses (new ones included). Fixed sections
 * always go with Vibratto's text, whatever the screen did, and come back if
 * missing; a saved editable clause can't disappear either (only the ones
 * made by the person can be removed). The back-end also refuses changes to
 * fixed sections
 */
export const mergeEditable = (
	original: ContractModel,
	draft: ContractModel
): ContractModel => {
	const before = new Map(
		original.secoes.map((section) => [section.id, section])
	);
	const secoes: Array<ContractModelSection> = draft.secoes.flatMap(
		(section) => {
			const saved = before.get(section.id);
			if (saved && !saved.editavel) return [saved];
			if (!section.editavel) return [];
			return [
				{
					...(saved ?? section),
					editavel: true,
					titulo: section.titulo.trim() || saved?.titulo || "Nova cláusula",
					texto: section.texto,
				},
			];
		}
	);

	for (const section of original.secoes) {
		const kept = secoes.some((item) => item.id === section.id);
		const removable = section.editavel && isNewClause(section);
		if (!kept && !removable)
			secoes.splice(Math.min(section.numero, secoes.length), 0, section);
	}

	return {
		...original,
		nome: draft.nome.trim() || original.nome,
		secoes: renumber(secoes),
	};
};

const shape = (model: ContractModel) =>
	JSON.stringify([
		model.nome,
		model.secoes.map(({ id, titulo, texto }) => [id, titulo, texto]),
	]);

/** Anything to save: name, text, title, order, new or removed clauses */
export const isModelChanged = (
	original: ContractModel,
	draft: ContractModel
): boolean => shape(original) !== shape(draft);

/** Editable clauses whose title or text differ, or that are new */
export const changedSections = (
	original: ContractModel,
	draft: ContractModel
): Array<ContractModelSection> =>
	draft.secoes.filter((section) => {
		if (!section.editavel) return false;
		const saved = original.secoes.find((s) => s.id === section.id);
		return (
			!saved || saved.texto !== section.texto || saved.titulo !== section.titulo
		);
	});

/** Problems that block saving */
export const modelErrors = (draft: ContractModel): Array<string> => {
	const errors: Array<string> = [];
	if (!draft.nome.trim()) errors.push("Dê um nome ao modelo.");
	for (const section of draft.secoes) {
		if (section.editavel && !section.titulo.trim())
			errors.push("Toda cláusula precisa de um título.");
		if (section.editavel && !section.texto.trim())
			errors.push(`A cláusula "${section.titulo}" está vazia.`);
	}
	return errors;
};

/** Names are compared without accents or case: "Casamento" = "casamento" */
export const isNameTaken = (
	name: string,
	others: Array<{ nome: string }>
): boolean => {
	const key = (text: string) =>
		text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
	return others.some((other) => key(other.nome) === key(name));
};

import type { ContractModelSection } from "../types";

/**
 * Order of the clauses. Vibratto's fixed sections at the start (introduction,
 * object, value) and at the end (signatures) stay where they are; only the
 * editable clauses between them move, and new ones go there too
 */

const ORDINALS = [
	"PRIMEIRA",
	"SEGUNDA",
	"TERCEIRA",
	"QUARTA",
	"QUINTA",
	"SEXTA",
	"SÉTIMA",
	"OITAVA",
	"NONA",
	"DÉCIMA",
	"DÉCIMA PRIMEIRA",
	"DÉCIMA SEGUNDA",
	"DÉCIMA TERCEIRA",
	"DÉCIMA QUARTA",
	"DÉCIMA QUINTA",
	"DÉCIMA SEXTA",
	"DÉCIMA SÉTIMA",
	"DÉCIMA OITAVA",
	"DÉCIMA NONA",
	"VIGÉSIMA",
];

/** "CLÁUSULA TERCEIRA - ..." for the 3rd clause; the intro (0) has none */
export const ordinalOf = (position: number): string | undefined =>
	ORDINALS[position - 1];

// Longest first: "DÉCIMA PRIMEIRA" before "DÉCIMA"
const BY_LENGTH = [...ORDINALS].sort((a, b) => b.length - a.length);

/**
 * The title with the ordinal of its new position: "CLÁUSULA SEXTA - DO
 * FORO" moved to 4th becomes "CLÁUSULA QUARTA - DO FORO". Titles without
 * an ordinal ("CLÁUSULA DE QUEBRA...") are left as they are
 */
export const renumberTitle = (title: string, position: number): string => {
	const ordinal = ordinalOf(position);
	const match = /^(\s*CLÁUSULA\s+)(.*)$/iu.exec(title);
	if (!ordinal || !match) return title;

	const [, prefix = "", rest = ""] = match;
	const found = BY_LENGTH.find((candidate) => {
		const head = rest.slice(0, candidate.length).toUpperCase();
		const next = rest.charAt(candidate.length);
		return head === candidate && (next === "" || /[\s\-–:]/.test(next));
	});
	if (!found) return title;

	return `${prefix}${ordinal}${rest.slice(found.length)}`;
};

/** The block of clauses that can move: between the fixed start and end */
export const movableRange = (
	sections: Array<ContractModelSection>
): { first: number; last: number } => {
	let first = 0;
	while (first < sections.length && !sections[first]?.editavel) first++;
	let last = sections.length - 1;
	while (last >= 0 && !sections[last]?.editavel) last--;
	return { first, last };
};

/** numero = position, and every ordinal title matching its place */
export const renumber = (
	sections: Array<ContractModelSection>
): Array<ContractModelSection> =>
	sections.map((section, index) => ({
		...section,
		numero: index,
		titulo: section.editavel
			? renumberTitle(section.titulo, index)
			: section.titulo,
	}));

/** Moves an editable clause one place up (-1) or down (+1) */
export const moveClause = (
	sections: Array<ContractModelSection>,
	id: number,
	direction: -1 | 1
): Array<ContractModelSection> => {
	const index = sections.findIndex((section) => section.id === id);
	const target = index + direction;
	const { first, last } = movableRange(sections);
	if (index < 0 || target < first || target > last) return sections;

	const ordered = [...sections];
	const [moved] = ordered.splice(index, 1);
	if (!moved) return sections;
	ordered.splice(target, 0, moved);
	return renumber(ordered);
};

/** A new id for a clause made on the screen (the API gives the real one) */
let lastNewId = 0;
export const newClauseId = (): number => {
	lastNewId = Math.min(lastNewId - 1, -Date.now());
	return lastNewId;
};

/** A new empty clause, right before the fixed end (signatures) */
export const addClause = (
	sections: Array<ContractModelSection>
): { sections: Array<ContractModelSection>; id: number } => {
	const { last } = movableRange(sections);
	// No editable clause yet: before the last fixed section
	const at = last >= 0 ? last + 1 : Math.max(0, sections.length - 1);
	const id = newClauseId();
	const ordered = [...sections];
	ordered.splice(at, 0, {
		id,
		numero: at,
		titulo: `CLÁUSULA ${ordinalOf(at) ?? ""} - NOVA CLÁUSULA`.replace(
			"  ",
			" "
		),
		texto: "",
		editavel: true,
	});
	return { sections: renumber(ordered), id };
};

/** Clauses made on the screen and not saved yet have a negative id */
export const isNewClause = (section: ContractModelSection): boolean =>
	section.id < 0;

export const removeClause = (
	sections: Array<ContractModelSection>,
	id: number
): Array<ContractModelSection> =>
	renumber(
		sections.filter((section) => !(section.id === id && section.editavel))
	);

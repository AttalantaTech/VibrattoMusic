/**
 * The "Contratação concluída" card. The hiring is often concluded by the
 * back-end (the last signature arrives from D4Sign), when no screen is open
 * to tell the chat. So the chat itself tells it: when the hired side opens a
 * conversation, the proposals whose cards stop before the conclusion are
 * checked
 */

/** Title of the card, also how an already sent one is recognized */
export const HIRING_CONCLUDED_TITLE = "Contratação concluída!";

// Down payment cards sent before the conclusion had its own card
const OLD_CONCLUDED_TEXT = "A contratação está concluída.";

const ENDED_TITLES = ["Proposta recusada", "Proposta cancelada"];

// "Acompanhar contratação" link: ...?tab=hires&id=12&andamento=1
const PROGRESS_LINK = /[?&;]id=(\d+)(?:&amp;|&)andamento=1/;

/**
 * The conclusion card speaks for the platform, not for who sent it: the chat
 * shows it in the middle, for both sides
 */
export const isHiringConcludedCard = (conteudo: string) =>
	conteudo.includes(HIRING_CONCLUDED_TITLE) && PROGRESS_LINK.test(conteudo);

/**
 * Proposals followed in the conversation (accepted, down payment) that have
 * no conclusion card yet and didn't end another way
 */
export const proposalsAwaitingConclusionCard = (
	messages: Array<{ conteudo: string }>
): Array<number> => {
	const awaiting = new Set<number>();
	const settled = new Set<number>();

	for (const { conteudo } of messages) {
		const id = Number(PROGRESS_LINK.exec(conteudo)?.[1]);
		if (!id) continue;

		const isSettled =
			conteudo.includes(HIRING_CONCLUDED_TITLE) ||
			conteudo.includes(OLD_CONCLUDED_TEXT) ||
			ENDED_TITLES.some((title) => conteudo.includes(title));

		if (isSettled) settled.add(id);
		else awaiting.add(id);
	}

	return [...awaiting].filter((id) => !settled.has(id));
};

const STORAGE_KEY = "hiring-concluded-announced";

const readAnnounced = (): Array<number> => {
	try {
		const saved: unknown = JSON.parse(
			window.localStorage.getItem(STORAGE_KEY) ?? "[]"
		);
		return Array.isArray(saved)
			? saved.filter((id): id is number => typeof id === "number")
			: [];
	} catch {
		return [];
	}
};

// Proposals this device already sent the card for: a second safeguard
// against sending it twice (the first is the card in the conversation)
const announced = new Set<number>(
	typeof window === "undefined" ? [] : readAnnounced()
);

export const wasConclusionAnnounced = (proposalId: number) =>
	announced.has(proposalId);

export const markConclusionAnnounced = (proposalId: number) => {
	announced.add(proposalId);
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...announced]));
	} catch {
		// Private window or blocked storage: the memory copy still holds
	}
};

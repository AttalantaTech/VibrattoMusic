import type { ChatRecipient, StartConversation } from "./types";

type SenderIds = Pick<
	StartConversation,
	"produtoMusicalId" | "produtoMusicalContratanteId"
>;

/**
 * Who signs a message sent through startConversation (status cards and the
 * first message of a conversation). A professional always sends as the
 * musical product (type 2), on either side of the proposal; only a
 * contractor without a professional profile sends as the user (type 1)
 */
export const buildSenderPayload = (
	recipient: ChatRecipient,
	ids: SenderIds
): { IdProdutoMusical: number | null; TipoRemetente: 1 | 2 } => {
	// The hired product writes to the contratante side
	if (recipient !== "produtoMusical") {
		return { IdProdutoMusical: ids.produtoMusicalId, TipoRemetente: 2 };
	}

	// A professional profile hiring another one: it went out as "user" and
	// the chat showed the card on the receiver's side for both
	if (ids.produtoMusicalContratanteId) {
		return {
			IdProdutoMusical: ids.produtoMusicalContratanteId,
			TipoRemetente: 2,
		};
	}

	return { IdProdutoMusical: null, TipoRemetente: 1 };
};

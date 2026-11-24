/**
 * The budget requests of ONE chat conversation (the band and whoever it is
 * talking to). The API lists only the ones still without a proposal
 * (Enviado: false, see proposalService), so the same filters give both the
 * "Solicitações de Orçamentos" list and the badge on "Propostas"; built in one
 * place so both always ask the same thing (and share the cached answer).
 *
 * The same person can talk to the band as a client and through a professional
 * profile of their own; each is a different conversation (seen on 24/11/2026:
 * requests 160 and 161, same client 63, the second one made by profile 880)
 */
export const budgetRequestFilters = ({
	produtoMusicalId,
	produtoMusicalContratanteId,
	contratanteId,
}: {
	produtoMusicalId: number | null;
	produtoMusicalContratanteId?: number | null;
	contratanteId: number;
}) =>
	produtoMusicalContratanteId
		? {
				IdContratante: null,
				IdProdutoMusicalContratante: produtoMusicalContratanteId,
				IdProdutoMusical: produtoMusicalId,
				onlyDirectRequests: false,
			}
		: {
				IdContratante: contratanteId || null,
				IdProdutoMusicalContratante: null,
				IdProdutoMusical: produtoMusicalId,
				// The client's own requests, not the ones made by their profiles
				onlyDirectRequests: true,
			};

/** "9+" past nine, so the badge stays a small circle */
export const pendingBadgeLabel = (count: number): string =>
	count > 9 ? "9+" : String(count);

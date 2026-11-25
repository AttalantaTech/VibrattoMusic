/** The brand, shown in every browser tab */
export const APP_NAME = "Vibratto Music";

/**
 * "Mensagens · Vibratto Music": the page first, so a narrow tab still shows
 * what tells it apart from the others. No name: just the brand
 */
export const formatPageTitle = (name?: string | null): string => {
	const page = name?.trim();
	return page ? `${page} · ${APP_NAME}` : APP_NAME;
};

/**
 * "(3) Mensagens · Vibratto Music": conversations with unread messages, so a
 * tab left open in the background shows that something arrived
 */
export const withUnreadCount = (title: string, unread: number): string =>
	unread > 0 ? `(${unread > 9 ? "9+" : unread}) ${title}` : title;

/**
 * Conversations with at least one unread message (the number on the header's
 * message icon and in the tab title)
 */
export const countUnreadConversations = (
	conversations?: Array<{ numeroMensagensNaoLidas?: number | null }> | null
): number =>
	conversations?.filter(
		(conversation) => (conversation.numeroMensagensNaoLidas ?? 0) > 0
	).length ?? 0;

/** The tabs of the logged-in area (/band/me?tab=...), as named in its menu */
const TAB_NAMES: Record<string, string> = {
	account: "Conta",
	messages: "Mensagens",
	bookings: "Agenda",
	sales: "Vendas",
	contracts: "Modelos de Contratos",
	hires: "Contratações",
	proposals: "Propostas",
	checklist: "Checklist",
	favorites: "Favoritos",
	settings: "Ajustes",
};

/**
 * The name of the page at this address ("" = only the brand). A page whose
 * name comes from data replaces it once loaded (usePageTitle): a band's
 * public profile shows "Perfil do artista" until the band's name arrives
 */
export const pageNameFor = (
	pathname: string,
	search: Record<string, unknown> = {}
): string => {
	const path = pathname.replace(/\/+$/, "") || "/";

	if (path === "/band/me") {
		const tab = typeof search["tab"] === "string" ? search["tab"] : "messages";
		return TAB_NAMES[tab] ?? "";
	}
	if (path.startsWith("/band/profile/")) return "Perfil do artista";
	if (path.startsWith("/band/contract/create")) return "Modelo de contrato";
	if (path.startsWith("/band/contract/")) return "Contrato";
	if (path === "/band/profile-type" || path.startsWith("/band/register"))
		return "Cadastro do perfil";
	if (path.startsWith("/proposta/")) return "Proposta";
	if (path === "/forgot-password" || path.startsWith("/reset-password"))
		return "Recuperar senha";

	const fixed: Record<string, string> = {
		"/search": "Buscar artistas",
		"/login": "Entrar",
		"/admin/login": "Entrar",
		"/register": "Criar conta",
		"/welcome": "Criar conta",
		"/cadastro": "Criar conta",
		"/favorites": "Favoritos",
	};
	return fixed[path] ?? "";
};

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
 * The name of the page at this address. "" = only the brand; null = the page
 * names itself, because the name comes from data (a band's public profile,
 * see usePageTitle)
 */
export const pageNameFor = (
	pathname: string,
	search: Record<string, unknown> = {}
): string | null => {
	const path = pathname.replace(/\/+$/, "") || "/";

	if (path === "/band/me") {
		const tab = typeof search["tab"] === "string" ? search["tab"] : "messages";
		return TAB_NAMES[tab] ?? "";
	}
	if (path.startsWith("/band/profile/")) return null;
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

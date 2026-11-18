import type { TemplateItem } from "../types";

/**
 * The suggested model: nobody starts with an empty screen. The professional
 * can remove, rename or add items, and the model goes to every new event
 */
export const DEFAULT_TEMPLATE: Array<TemplateItem> = [
	{ id: "chegada", label: "Horário de chegada confirmado", group: "logistica" },
	{
		id: "endereco",
		label: "Endereço e acesso ao local confirmados",
		group: "logistica",
	},
	{
		id: "responsavel",
		label: "Contato do responsável no local",
		group: "logistica",
	},
	{ id: "alimentacao", label: "Alimentação combinada", group: "logistica" },
	{ id: "repertorio", label: "Repertório definido", group: "equipamento" },
	{ id: "instrumentos", label: "Instrumentos revisados", group: "equipamento" },
	{ id: "cabos", label: "Cabos e pedestais", group: "equipamento" },
	{
		id: "reserva",
		label: "Cordas, baquetas e peças reserva",
		group: "equipamento",
	},
	{
		id: "baterias",
		label: "Pilhas e baterias carregadas",
		group: "equipamento",
	},
	{
		id: "energia",
		label: "Ponto de energia próximo ao palco",
		group: "contratante",
	},
	{
		id: "espaco",
		label: "Espaço do palco conforme o mapa de palco",
		group: "contratante",
	},
	{ id: "agua", label: "Água no palco", group: "contratante" },
	{
		id: "descarga",
		label: "Local para descarga dos equipamentos",
		group: "contratante",
	},
	{ id: "saldo", label: "Saldo recebido", group: "depois" },
	{ id: "nota", label: "Nota fiscal emitida", group: "depois" },
	{ id: "avaliacao", label: "Pedir avaliação ao contratante", group: "depois" },
	{
		id: "midia",
		label: "Fotos e vídeos guardados para divulgação",
		group: "depois",
	},
];

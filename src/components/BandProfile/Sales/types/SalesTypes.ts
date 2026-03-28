/* eslint-disable camelcase */
import { Calendar, CheckCircle, Clock, Clock3, XCircle } from "lucide-react";

export const unifiedStatusConfig = {
	pendente: {
		label: "Aguardando Assinatura",
		icon: Clock3,
		variant: "warning" as const,
		color: "text-yellow-600",
		bgColor: "bg-yellow-50",
	},
	aguardando_aceite: {
		label: "Aguardando Aceite",
		icon: Clock,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-50",
	},
	aguardando_assinatura_contratante: {
		label: "Aguardando Assinatura do Contratante",
		icon: Clock,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-50",
	},
	aguardando_assinatura_profissional: {
		label: "Aguardando Assinatura do Profissional",
		icon: Clock,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-50",
	},
	aguardando_pagamento: {
		label: "Aguardando Pagamento",
		icon: Clock,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-50",
	},
	aceito: {
		label: "Agendado",
		icon: Calendar,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-50",
	},
	aceita: {
		label: "Agendado",
		icon: Calendar,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-50",
	},
	concluido: {
		label: "Concluído",
		icon: CheckCircle,
		variant: "success" as const,
		color: "text-green-600",
		bgColor: "bg-green-50",
	},
	rejeitado: {
		label: "Rejeitado",
		icon: XCircle,
		variant: "error" as const,
		color: "text-red-600",
		bgColor: "bg-red-50",
	},
	cancelado: {
		label: "Cancelado",
		icon: XCircle,
		variant: "secondary" as const,
		color: "text-gray-600",
		bgColor: "bg-gray-50",
	},
};

import type { LucideProps } from "lucide-react";

export type PaymentStatusCardProps = {
	name: string;
};

type StatusCardConfigDictType = {
	[key: string]: {
		label: string;
		icon: React.ForwardRefExoticComponent<
			Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
		>;
		variant: "warning" | "secondary" | "success" | "error";
		color: string;
		bgColor: string;
		borderColor: string;
	};
};

export const StatusCardConfigDict: StatusCardConfigDictType = {
	// pendente: {
	// 	label: "Aguardando Aceite",
	// 	icon: Clock,
	// 	variant: "warning" as const,
	// 	color: "text-yellow-600",
	// 	bgColor: "bg-yellow-100",
	// 	borderColor: "border-yellow-200",
	// },
	// sinalpago: {
	// 	label: "Sinal Pago",
	// 	icon: DollarSign,
	// 	variant: "secondary" as const,
	// 	color: "text-orange-600",
	// 	bgColor: "bg-orange-100",
	// 	borderColor: "border-orange-200",
	// },
	// aguardando_assinatura_contratante: {
	// 	label: "Aguardando Assinatura do Contratante",
	// 	icon: PenTool,
	// 	variant: "secondary" as const,
	// 	color: "text-orange-600",
	// 	bgColor: "bg-orange-100",
	// 	borderColor: "border-orange-200",
	// },
	// aguardando_assinatura_profissional: {
	// 	label: "Aguardando Assinatura do Profissional",
	// 	icon: UserCheck,
	// 	variant: "secondary" as const,
	// 	color: "text-purple-600",
	// 	bgColor: "bg-purple-100",
	// 	borderColor: "border-purple-200",
	// },
	// aguardandopagamento: {
	// 	label: "Aguardando Pagamento",
	// 	icon: CreditCard,
	// 	variant: "secondary" as const,
	// 	color: "text-red-600",
	// 	bgColor: "bg-red-100",
	// 	borderColor: "border-red-200",
	// },
	// aceita: {
	// 	label: "Agendado",
	// 	icon: Calendar,
	// 	variant: "secondary" as const,
	// 	color: "text-primary-600",
	// 	bgColor: "bg-primary-100",
	// 	borderColor: "border-primary-200",
	// },
	// concluido: {
	// 	label: "Concluído",
	// 	icon: Award,
	// 	variant: "success" as const,
	// 	color: "text-green-600",
	// 	bgColor: "bg-green-100",
	// 	borderColor: "border-green-200",
	// },
	// rejeitada: {
	// 	label: "Rejeitada",
	// 	icon: XCircle,
	// 	variant: "error" as const,
	// 	color: "text-red-600",
	// 	bgColor: "bg-red-100",
	// 	borderColor: "border-red-200",
	// },
	// cancelado: {
	// 	label: "Cancelado",
	// 	icon: XCircle,
	// 	variant: "secondary" as const,
	// 	color: "text-gray-600",
	// 	bgColor: "bg-gray-100",
	// 	borderColor: "border-gray-200",
	// },
};

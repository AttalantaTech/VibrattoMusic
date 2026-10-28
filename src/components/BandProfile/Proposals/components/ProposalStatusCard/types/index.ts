import type { LucideProps } from "lucide-react";
import {
	Award,
	Clock,
	DollarSign,
	PenTool,
	XCircle,
	FileArchive,
	Check,
} from "lucide-react";

export type ProposalStatusCardProps = {
	name: string;
};

type ProposalStatusCardConfigDictType = {
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

export const proposalStatusCardConfigDict: ProposalStatusCardConfigDictType = {
	Pendente: {
		label: "Pendente",
		icon: Clock,
		variant: "warning" as const,
		color: "text-yellow-600",
		bgColor: "bg-yellow-100",
		borderColor: "border-yellow-200",
	},
	Aceita: {
		label: "Aceita",
		icon: Award,
		variant: "success" as const,
		color: "text-green-600",
		bgColor: "bg-green-100",
		borderColor: "border-green-200",
	},
	Rejeitada: {
		label: "Rejeitada",
		icon: XCircle,
		variant: "error" as const,
		color: "text-red-600",
		bgColor: "bg-red-100",
		borderColor: "border-red-200",
	},
	ContratacaoConcluida: {
		label: "Contratação Concluída",
		icon: Check,
		variant: "secondary" as const,
		color: "text-green-600",
		bgColor: "bg-green-100",
		borderColor: "border-green-200",
	},
	Cancelada: {
		label: "Cancelada",
		icon: XCircle,
		variant: "secondary" as const,
		color: "text-gray-400",
		bgColor: "bg-gray-100",
		borderColor: "border-gray-200",
	},
	Vencida: {
		label: "Vencida",
		icon: FileArchive,
		variant: "secondary" as const,
		color: "text-orange-600",
		bgColor: "bg-orange-100",
		borderColor: "border-orange-200",
	},
	Substituida: {
		label: "Substituida",
		icon: PenTool,
		variant: "secondary" as const,
		color: "text-yellow-600",
		bgColor: "bg-yellow-100",
		borderColor: "border-yellow-200",
	},
	AguardandoPagamento: {
		label: "Aguardando Pagamento",
		icon: DollarSign,
		variant: "secondary" as const,
		color: "text-white",
		bgColor: "bg-primary-400",
		borderColor: "border-primary-300",
	},
};

import type { LucideProps } from "lucide-react";
import {
	Award,
	Clock,
	DollarSign,
	PenTool,
	XCircle,
	FileArchive,
	File,
	FileSignature,
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

export const ProposalStatusCardConfigDict: ProposalStatusCardConfigDictType = {
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
	Cancelado: {
		label: "Cancelado",
		icon: XCircle,
		variant: "secondary" as const,
		color: "text-gray-600",
		bgColor: "bg-gray-100",
		borderColor: "border-gray-200",
	},
	SinalPago: {
		label: "Sinal Pago",
		icon: DollarSign,
		variant: "secondary" as const,
		color: "text-white",
		bgColor: "bg-primary-400",
		borderColor: "border-primary-300",
	},
	AguardandoAssinatura: {
		label: "Aguardando Assinatura",
		icon: FileArchive,
		variant: "secondary" as const,
		color: "text-cyan-600",
		bgColor: "bg-cyan-100",
		borderColor: "border-cyan-200",
	},
	EnvioAssinatura: {
		label: "Envio de Assinatura",
		icon: PenTool,
		variant: "secondary" as const,
		color: "text-primary-600",
		bgColor: "bg-primary-100",
		borderColor: "border-primary-200",
	},
	EnvioDocumento: {
		label: "Envio de Documento",
		icon: File,
		variant: "secondary" as const,
		color: "text-purple-600",
		bgColor: "bg-purple-100",
		borderColor: "border-purple-200",
	},
	EnvioSignatarios: {
		label: "Envio de Signatarios",
		icon: FileSignature,
		variant: "secondary" as const,
		color: "text-orange-600",
		bgColor: "bg-orange-100",
		borderColor: "border-orange-200",
	},
	ContratoAssinado: {
		label: "Envio de Signatarios",
		icon: Check,
		variant: "secondary" as const,
		color: "text-green-600",
		bgColor: "bg-green-100",
		borderColor: "border-green-200",
	},
};

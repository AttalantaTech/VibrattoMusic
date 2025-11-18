export type FunctionComponent = React.ReactElement | null;

type HeroIconSVGProps = React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> &
	React.RefAttributes<SVGSVGElement>;
type IconProps = HeroIconSVGProps & {
	title?: string;
	titleId?: string;
};
export type Heroicon = React.FC<IconProps>;

export interface FileInfo {
	name: string;
	size: string;
}

export interface Event {
	id: number;
	title: string;
	date: Date;
	startTime: string;
	description?: string;
	endTime: string;
}

export interface MyEvent {
	id: string;
	title: string;
	date: string;
	status: "Pago" | "Pendente";
	client: string;
	value: string;
}

export type Report = {
	icon: React.ReactNode;
	value: number;
	isUp: boolean;
	percentage: number;
	label: string;
};

export type HiringStatus =
	| "Proposta recebida"
	| "Aguardando pagamento"
	| "Contrato pendente"
	| "Contrato assinado"
	| "Cancelada";

export type MyHiring = {
	id: string;
	title: string; // Nome do evento/serviço
	date: string;
	status: HiringStatus;
	hiredArtist: string; // Nome do músico contratado
	service: string; // Serviço contratado (ex: "Show completo", "Backing vocal", etc.)
	value: string;
	contractId?: string; // ID do contrato para acessar detalhes
	proposalId?: string; // ID da proposta para visualizar
	canCancel: boolean; // Se pode cancelar antes do pagamento
};

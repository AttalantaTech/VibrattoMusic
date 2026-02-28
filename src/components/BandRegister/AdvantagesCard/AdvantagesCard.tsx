import {
	ArrowDown,
	AudioLines,
	Check,
	ChevronRight,
	AlertCircle,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { useProfileStatus } from "../../../hooks/useProfileStatus";

interface AdvantagesCardProps {
	onStart: () => void;
	onSkip?: () => void;
}

export const AdvantagesCard = ({ onStart, onSkip }: AdvantagesCardProps) => {
	const { isProfileIncomplete, musicalProducts, isLoading } =
		useProfileStatus();

	const advantages = [
		{
			title: "Agenda Inteligente",
			description:
				"Mantenha seus compromissos organizados e mostre sua disponibilidade para novos eventos.",
		},
		{
			title: "Mídia Kit Completo",
			description:
				"Destaque seus vídeos, rider técnico e camarim, além de criar o mapa de palco diretamente na plataforma.",
		},
		{
			title: "Monetização Flexível",
			description: "Negocie e feche contratos direto da plataforma.",
		},
	];

	return (
		<div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 gap-6 sm:gap-8">
			<div className="flex w-full items-center justify-center">
				<AudioLines
					color="rgba(0, 123, 255, 1)"
					size={32}
					className="sm:w-10 sm:h-10"
				/>
			</div>
			<div className="flex flex-col w-full items-center justify-center text-center gap-2 sm:gap-[6px]">
				<h1 className="text-gray-900 font-bold text-xl sm:text-2xl lg:text-3xl">
					Conecte sua Música com o Mundo
				</h1>
				<h2 className="text-gray-600 font-normal text-base sm:text-lg lg:text-xl">
					Cadastre sua banda e feche contratos sem complicação
				</h2>

				{/* Profile Status Indicator */}
				{!isLoading &&
					isProfileIncomplete &&
					musicalProducts &&
					musicalProducts.dados.length > 0 && (
						<div className="flex items-center gap-2 mt-4 px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
							<AlertCircle className="w-5 h-5 text-orange-500" />
							<span className="text-orange-700 text-sm font-medium">
								Seu perfil está incompleto. Complete-o para enviar propostas.
							</span>
						</div>
					)}
			</div>

			{/*Advantages Box */}
			<div className="rounded-lg border border-gray-200 bg-[#f9fafb] flex flex-col items-center justify-center gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 w-full max-w-lg">
				{/* Header */}
				<div className="flex w-full items-center justify-between text-gray-900 font-semibold text-lg sm:text-xl">
					<span>Vantagens exclusivas</span>
					<ArrowDown size={20} className="sm:w-6 sm:h-6" />
				</div>

				{/* List */}
				<div className="flex flex-col w-full gap-4 sm:gap-6 justify-center items-center">
					{advantages.map((item, index) => (
						<div key={index} className="flex w-full items-start">
							<div className="flex gap-2 sm:gap-3">
								<Check
									color="rgba(0, 123, 255, 1)"
									size={20}
									className="sm:w-6 sm:h-6 mt-0.5"
								/>
								<div className="flex flex-col">
									<span className="text-gray-900 font-semibold text-base sm:text-lg">
										{item.title}
									</span>
									<span className="text-gray-600 text-sm sm:text-base">
										{item.description}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="flex w-full items-center justify-center gap-3 py-4 sm:py-6 px-4 sm:px-7 h-full">
					<Button className="w-full h-12 sm:h-14" onClick={onStart}>
						<span className="flex items-center justify-center gap-2 sm:gap-3">
							<span className="font-semibold text-base sm:text-lg">
								Começar
							</span>
							<ChevronRight size={20} className="sm:w-6 sm:h-6" />
						</span>
					</Button>
					<Button
						variant="outline"
						className="w-full h-12 sm:h-14"
						onClick={onSkip}
					>
						Pular cadastro completo
					</Button>
				</div>
			</div>
		</div>
	);
};

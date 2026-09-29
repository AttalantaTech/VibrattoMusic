import { Input } from "@/components/ui/Input/Input";
import { Eye, EyeOff } from "lucide-react";
import { IconTabNavigation } from "@/components/ui/IconTabNavigation/IconTabNavigation";
import { SectionHeader } from "./shared/SectionHeader";
import { Label } from "@/components/ui/Label/Label";

type Props = {
	show: boolean;
	value: string | null;
	onToggle: (v: boolean) => void;
	onChange: (v: string) => void;
};

export function PriceSection({ show, value, onToggle, onChange }: Props) {
	return (
		<div className="bg-gray-50 py-6 border-b">
			<SectionHeader
				title="Valores e Orçamento"
				subtitle="Defina como os contratantes verão suas informações de valores."
			/>

			<div className="mb-4">
				<IconTabNavigation
					currentTab={String(show)}
					tabs={[
						{
							label: "Mostrar valor",
							value: "true",
							icon: <Eye />,
						},
						{
							label: "Ocultar",
							value: "false",
							icon: <EyeOff />,
						},
					]}
					onChange={(v) => {
						onToggle(v === "true");
					}}
				/>
			</div>

			{show && (
				<>
					<div className="space-y-2">
						<Label className="text-sm font-medium">Valor por evento</Label>
						<div className="relative">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<span className="text-gray-500 text-sm font-medium">R$</span>
							</div>
							<Input
								type="number"
								placeholder="1.000,00"
								className="pl-10"
								value={value ?? ""}
								onChange={(event) => {
									onChange(event.target.value);
								}}
							/>
						</div>
						<p className="text-xs text-gray-500">
							Esse valor será exibido no seu perfil
						</p>
					</div>
				</>
			)}
		</div>
	);
}

import { KeyRoundIcon } from "lucide-react";
import { OptionBox } from "../../OptionBox/OptionBox";
import { InputField } from "../../forms/InputField/InputField";
import { Button } from "../../ui/Button/Button";

export const PasswordTab = () => {
	return (
		<OptionBox
			headerIcon={<KeyRoundIcon color="#007bff" size={24} />}
			headerTitle="Senha"
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col gap-3">
					<InputField
						label="Senha Atual"
						name="currentPassword"
						placeholder="********"
						type="password"
					/>
					<InputField
						label="Nova Senha"
						name="newPassword"
						placeholder="********"
						type="password"
					/>
					<InputField
						label="Confirme sua Nova Senha"
						name="newPassword"
						placeholder="********"
						type="password"
					/>
				</div>
				<div className="flex flex-col gap-3 items-center justify-center">
					<a className="underline text-gray-600" href="#">
						Esqueci minha senha
					</a>
					<Button className="bg-white" variant="outline">
						Salvar Alterações
					</Button>
				</div>
			</div>
		</OptionBox>
	);
};

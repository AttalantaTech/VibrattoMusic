import { Button } from "../../components/ui/Button/Button";
import LogoVibratto from "../../assets/images/Logo_Vibratto.png";
import VibrattoName from "../../assets/images/Vibratto.png";
import type { FunctionComponent } from "../../common/types";
import { CheckboxField } from "../../components/forms/CheckBoxField/CheckBoxField";
import { InputField } from "../../components/forms/InputField/InputField";

export const AdminLogin = (): FunctionComponent => {
	return (
		<div className="min-h-screen items-center justify-center flex flex-col">
			<div className="w-full max-w-[390px] flex flex-col gap-8 px-4">
				{/* Header */}
				<div className="flex flex-col items-center justify-center text-center gap-6">
					<div className="flex items-center justify-around">
						<img
							alt="Vibratto logo"
							className="w-auto h-8"
							src={LogoVibratto}
						/>
						<img
							alt="Vibratto logo"
							className="w-auto  h-6"
							src={VibrattoName}
						/>
					</div>
					<div className="flex flex-col items-center gap-3">
						<h1 className="font-semibold text-3xl ">
							Bem-vindo à Vibratto Pro
						</h1>
						<h2 className="font-normal text-base text-gray-500">
							Insira suas credenciais para acessar sua conta
						</h2>
					</div>
				</div>

				{/* Content */}
				<div className="flex flex-col gap-4">
					<InputField
						label="Email"
						name="email"
						placeholder="Insira seu email"
						type="email"
					/>
					<InputField label="Senha" name="password" type="password" />
					<div className="flex flex-row justify-between">
						<CheckboxField label="Lembrar-me" name="remember" />
						<a className="text-blue-700 font-semibold" href="#">
							Esqueci minha senha
						</a>
					</div>
					<Button className="w-full">Entrar</Button>
				</div>
			</div>
		</div>
	);
};

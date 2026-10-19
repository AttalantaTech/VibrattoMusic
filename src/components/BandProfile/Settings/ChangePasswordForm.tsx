import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button/Button";
import { useChangePassword } from "@/hooks/useUser";
import {
	changePasswordSchema,
	type ChangePasswordFormData,
} from "./schemas/settingsSchemas";
import { showApiError } from "@/utils/showApiError";

interface PasswordInputProps {
	label: string;
	registration: UseFormRegisterReturn;
	error?: string;
}

const PasswordInput = ({ label, registration, error }: PasswordInputProps) => {
	const [isVisible, setIsVisible] = useState(false);

	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-1">
				{label}
			</label>
			<div className="relative">
				<input
					{...registration}
					type={isVisible ? "text" : "password"}
					className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					type="button"
					onClick={() => {
						setIsVisible(!isVisible);
					}}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
				>
					{isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
				</button>
			</div>
			{error && <p className="text-red-600 text-sm mt-1">{error}</p>}
		</div>
	);
};

export const ChangePasswordForm = () => {
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const changePasswordMutation = useChangePassword();

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ChangePasswordFormData>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { senhaAtual: "", novaSenha: "", confirmarSenha: "" },
	});

	const closeForm = () => {
		reset();
		setIsChangingPassword(false);
	};

	const onSubmit = async ({
		senhaAtual,
		novaSenha,
	}: ChangePasswordFormData) => {
		try {
			const response = await changePasswordMutation.mutateAsync({
				senhaAtual,
				novaSenha,
			});
			toast.success(response?.mensagem ?? "Senha alterada com sucesso!");
			closeForm();
		} catch (error: unknown) {
			showApiError(error, "Não foi possível alterar sua senha.");
		}
	};

	if (!isChangingPassword) {
		return (
			<div>
				<h4 className="font-medium text-gray-900 mb-2">Senha</h4>
				<p className="text-sm text-gray-600 mb-4">
					Altere a senha de acesso à sua conta
				</p>
				<Button
					variant="outline"
					onClick={() => {
						setIsChangingPassword(true);
					}}
				>
					Alterar Senha
				</Button>
			</div>
		);
	}

	return (
		<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
			<PasswordInput
				label="Senha Atual"
				registration={register("senhaAtual")}
				error={errors.senhaAtual?.message}
			/>
			<PasswordInput
				label="Nova Senha"
				registration={register("novaSenha")}
				error={errors.novaSenha?.message}
			/>
			<PasswordInput
				label="Confirmar Nova Senha"
				registration={register("confirmarSenha")}
				error={errors.confirmarSenha?.message}
			/>
			<div className="flex gap-2">
				<Button type="submit" disabled={changePasswordMutation.isPending}>
					{changePasswordMutation.isPending
						? "Salvando..."
						: "Salvar Nova Senha"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={closeForm}
					disabled={changePasswordMutation.isPending}
				>
					Cancelar
				</Button>
			</div>
		</form>
	);
};

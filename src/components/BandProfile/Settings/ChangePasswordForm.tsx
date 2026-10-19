import { useMemo, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button/Button";
import { useChangePassword } from "@/hooks/useUser";
import {
	createChangePasswordSchema,
	type ChangePasswordFormData,
} from "./schemas/settingsSchemas";
import { showApiError } from "@/utils/showApiError";
import { useAuthStore } from "@/store/authStore";
import { PasswordRequirements } from "@/components/forms/PasswordRequirements";

interface PasswordInputProps {
	label: string;
	registration: UseFormRegisterReturn;
	error?: string;
	hint?: React.ReactNode;
}

const PasswordInput = ({
	label,
	registration,
	error,
	hint,
}: PasswordInputProps) => {
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
			{hint}
			{error && <p className="text-red-600 text-sm mt-1">{error}</p>}
		</div>
	);
};

export const ChangePasswordForm = () => {
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const changePasswordMutation = useChangePassword();
	const user = useAuthStore((state) => state.user);

	const schema = useMemo(
		() => createChangePasswordSchema([user?.nome, user?.email]),
		[user?.nome, user?.email]
	);

	const {
		register,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<ChangePasswordFormData>({
		resolver: zodResolver(schema),
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
				hint={<PasswordRequirements password={watch("novaSenha")} />}
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

import { Controller } from "react-hook-form";
import { Save, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button/Button";
import { InputField } from "@/components/forms/InputField/InputField";
import { Select } from "@/components/forms/Select/Select";
import { useUpdateUser, useUser } from "@/hooks/useUser";
import { useAuthStore } from "@/store/authStore";
import { SettingsSection } from "./SettingsSection";
import { useProfileSettingsForm } from "./hooks/useProfileSettingsForm";
import type { ProfileSettingsFormData } from "./schemas/settingsSchemas";
import { DOCUMENT_TYPE_OPTIONS, type DocumentType } from "@/utils/validation";
import {
	CEP_MASK,
	CNPJ_MASK,
	CPF_MASK,
	PHONE_MASK,
	onlyAlphanumeric,
	onlyDigits,
} from "@/utils/validation";
import { showApiError } from "@/utils/showApiError";

const FieldError = ({ message }: { message?: string }) =>
	message ? <p className="text-red-600 text-sm mt-1">{message}</p> : null;

const GroupTitle = ({ children }: { children: React.ReactNode }) => (
	<h4 className="font-medium text-gray-900 pt-2">{children}</h4>
);

export const ProfileSection = () => {
	const authUser = useAuthStore((state) => state.user);
	const { data: userData, isLoading } = useUser();
	const updateUserMutation = useUpdateUser();
	const { form, isLoadingAddress, lookupAddress } =
		useProfileSettingsForm(userData);

	const {
		control,
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isDirty },
	} = form;

	const isCnpj = watch("tipoDocumento") === "cnpj";
	const isBusy = isLoading || updateUserMutation.isPending;

	const onSubmit = async (data: ProfileSettingsFormData) => {
		try {
			// The API expects the full registration data on every update
			await updateUserMutation.mutateAsync({
				nome: data.nome,
				celular: onlyDigits(data.celular),
				cpfOuCnpj: onlyAlphanumeric(data.cpfOuCnpj),
				nomeResponsavelLegal: isCnpj ? data.nomeResponsavelLegal : "",
				cpfResponsavelLegal: isCnpj ? onlyDigits(data.cpfResponsavelLegal) : "",
				cep: onlyDigits(data.cep),
				logradouro: data.logradouro,
				numero: data.numero,
				complemento: data.complemento,
				bairro: data.bairro,
				cidade: data.cidade,
				estado: data.estado.toUpperCase(),
			});
			reset(data);
			toast.success("Dados atualizados com sucesso!");
		} catch (error: unknown) {
			showApiError(error, "Não foi possível salvar suas alterações.");
		}
	};

	return (
		<SettingsSection
			title="Informações do Perfil"
			description="Gerencie suas informações pessoais e profissionais"
			icon={<User size={24} />}
		>
			<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<GroupTitle>Dados pessoais</GroupTitle>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="md:col-span-2">
						<InputField
							{...register("nome")}
							label={isCnpj ? "Razão Social" : "Nome Completo"}
							disabled={isBusy}
						/>
						<FieldError message={errors.nome?.message} />
					</div>
					<div>
						<InputField
							name="email"
							label="Email"
							type="email"
							value={userData?.email ?? authUser?.email ?? ""}
							readOnly
							disabled
							className="disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
							helperText="O e-mail não pode ser alterado."
						/>
					</div>
					<div>
						<Controller
							name="celular"
							control={control}
							render={({ field }) => (
								<InputField
									{...field}
									label="WhatsApp"
									mask={PHONE_MASK}
									maskPlaceholder="11 99999-9999"
									disabled={isBusy}
								/>
							)}
						/>
						<FieldError message={errors.celular?.message} />
					</div>
				</div>

				<GroupTitle>Documento</GroupTitle>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div>
						<Controller
							name="tipoDocumento"
							control={control}
							render={({ field }) => (
								<Select
									label="Tipo"
									name="tipoDocumento"
									options={DOCUMENT_TYPE_OPTIONS}
									placeholder="Selecione..."
									clearable={false}
									disabled={isBusy}
									selectedOptions={DOCUMENT_TYPE_OPTIONS.filter(
										(option) => option.value === field.value
									)}
									setSelectedOptions={(options) => {
										const value = options[0]?.value as DocumentType | undefined;
										if (!value || value === field.value) return;
										field.onChange(value);
										// A document typed for one type is invalid for the other
										setValue("cpfOuCnpj", "", { shouldDirty: true });
									}}
								/>
							)}
						/>
					</div>
					<div className="md:col-span-3">
						<Controller
							name="cpfOuCnpj"
							control={control}
							render={({ field }) => (
								<InputField
									{...field}
									key={isCnpj ? "cnpj" : "cpf"}
									label={isCnpj ? "CNPJ" : "CPF"}
									mask={isCnpj ? CNPJ_MASK : CPF_MASK}
									maskPlaceholder={
										isCnpj ? "XX.XXX.XXX/XXXX-00" : "000.000.000-00"
									}
									helperText={
										isCnpj ? "O CNPJ pode conter letras e números." : undefined
									}
									disabled={isBusy}
								/>
							)}
						/>
						<FieldError message={errors.cpfOuCnpj?.message} />
					</div>

					{isCnpj && (
						<>
							<div className="md:col-span-2">
								<InputField
									{...register("nomeResponsavelLegal")}
									label="Nome do Responsável Legal"
									disabled={isBusy}
								/>
								<FieldError message={errors.nomeResponsavelLegal?.message} />
							</div>
							<div className="md:col-span-2">
								<Controller
									name="cpfResponsavelLegal"
									control={control}
									render={({ field }) => (
										<InputField
											{...field}
											label="CPF do Responsável Legal"
											mask={CPF_MASK}
											maskPlaceholder="000.000.000-00"
											disabled={isBusy}
										/>
									)}
								/>
								<FieldError message={errors.cpfResponsavelLegal?.message} />
							</div>
						</>
					)}
				</div>

				<GroupTitle>Endereço</GroupTitle>
				<div className="grid grid-cols-1 md:grid-cols-6 gap-4">
					<div className="md:col-span-2">
						<Controller
							name="cep"
							control={control}
							render={({ field }) => (
								<InputField
									{...field}
									label="CEP"
									mask={CEP_MASK}
									maskPlaceholder="00000-000"
									disabled={isBusy}
									helperText={
										isLoadingAddress ? "Buscando endereço..." : undefined
									}
									onChange={(event) => {
										const changed =
											onlyDigits(event.target.value) !==
											onlyDigits(field.value);
										field.onChange(event.target.value);
										if (changed) void lookupAddress(event.target.value);
									}}
								/>
							)}
						/>
						<FieldError message={errors.cep?.message} />
					</div>
					<div className="md:col-span-4">
						<InputField
							{...register("logradouro")}
							label="Logradouro"
							disabled={isBusy}
						/>
						<FieldError message={errors.logradouro?.message} />
					</div>
					<div className="md:col-span-2">
						<InputField
							{...register("numero")}
							label="Número"
							disabled={isBusy}
						/>
						<FieldError message={errors.numero?.message} />
					</div>
					<div className="md:col-span-4">
						<InputField
							{...register("complemento")}
							label="Complemento (opcional)"
							disabled={isBusy}
						/>
					</div>
					<div className="md:col-span-2">
						<InputField
							{...register("bairro")}
							label="Bairro"
							disabled={isBusy}
						/>
						<FieldError message={errors.bairro?.message} />
					</div>
					<div className="md:col-span-3">
						<InputField
							{...register("cidade")}
							label="Cidade"
							disabled={isBusy}
						/>
						<FieldError message={errors.cidade?.message} />
					</div>
					<div className="md:col-span-1">
						<InputField
							{...register("estado")}
							label="UF"
							maxLength={2}
							disabled={isBusy}
						/>
						<FieldError message={errors.estado?.message} />
					</div>
				</div>

				<div className="pt-4">
					<Button
						type="submit"
						className="flex items-center gap-2"
						disabled={!isDirty || isBusy}
					>
						<Save size={18} />
						{updateUserMutation.isPending ? "Salvando..." : "Salvar Alterações"}
					</Button>
				</div>
			</form>
		</SettingsSection>
	);
};

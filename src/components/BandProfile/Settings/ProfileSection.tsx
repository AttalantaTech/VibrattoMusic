import { useState } from "react";
import { Controller } from "react-hook-form";
import { Info, Save, User } from "lucide-react";
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
import { imageUploadService } from "@/api";
import { ImageUploadArea } from "@/components/ImageUploadArea/ImageUploadArea";
import { useProfilePhotoDraft } from "@/hooks/useProfilePhotoDraft";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

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

	const photo = useProfilePhotoDraft(userData?.fotoPerfil);
	const [isSavingPhoto, setIsSavingPhoto] = useState(false);

	// These are the account owner's (contractor) data. With a professional
	// profile active they are shown, since the band's proposals may carry them,
	// but only edited from the contractor profile: there the photo would pass
	// for the band's
	const { activeProduct, setActiveProduct } = useMusicalProductStore();
	const isReadOnly = !!activeProduct;

	const isCnpj = watch("tipoDocumento") === "cnpj";
	const isBusy = isLoading || isSavingPhoto || updateUserMutation.isPending;
	const isLocked = isBusy || isReadOnly;

	// The new photo goes up first, then the old one is deleted, so a failed
	// upload never leaves the profile without its current photo
	const savePhoto = async (): Promise<string | null> => {
		if (!photo.isChanged) return photo.stored;

		setIsSavingPhoto(true);
		try {
			const uploaded = photo.file
				? await imageUploadService.uploadUserProfilePhoto(photo.file)
				: null;
			if (photo.stored) {
				await imageUploadService.deleteImage({
					evento: "UsuarioFotoPerfil",
					idCadastro: 0,
					idLista: null,
				});
			}
			return uploaded;
		} finally {
			setIsSavingPhoto(false);
		}
	};

	const onSubmit = async (data: ProfileSettingsFormData) => {
		try {
			const fotoPerfil = await savePhoto();
			// The API expects the full registration data on every update, the
			// photo included: leaving it out would erase it
			await updateUserMutation.mutateAsync({
				nome: data.nome,
				razaoSocial: isCnpj ? data.razaoSocial : null,
				fotoPerfil,
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
			photo.clear();
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
				{isReadOnly && (
					<div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-2">
							<Info size={16} className="mt-0.5 shrink-0 text-gray-500" />
							<p className="text-sm text-gray-600">
								Estes dados são do seu perfil de contratante e aparecem aqui
								apenas para consulta. Se precisar atualizá-los, é só acessar o
								perfil de contratante.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="shrink-0 self-start sm:self-auto"
							onClick={() => {
								setActiveProduct(null);
							}}
						>
							Ir para o perfil de contratante
						</Button>
					</div>
				)}
				<GroupTitle>Dados pessoais</GroupTitle>
				{/* Photo on the left, names and contact beside it (stacked on phones) */}
				<div className="flex flex-col gap-4 md:flex-row md:gap-6">
					<div className="mx-auto w-full max-w-[160px] shrink-0 md:mx-0">
						{isReadOnly ? (
							<div className="space-y-3">
								<h3 className="text-center text-sm font-medium text-gray-900">
									Foto de Perfil
								</h3>
								<div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
									{photo.stored ? (
										<img
											src={photo.stored}
											alt="Foto de perfil do contratante"
											className="h-full w-full object-cover"
										/>
									) : (
										<User size={40} className="text-gray-300" />
									)}
								</div>
							</div>
						) : (
							<ImageUploadArea
								title="Foto de Perfil (opcional)"
								description="JPG, PNG até 5MB"
								currentImage={photo.currentImage}
								isUploading={isSavingPhoto}
								onFileSelect={photo.select}
								onDelete={photo.remove}
								aspectRatio="aspect-square"
							/>
						)}
					</div>
					<div className="grid min-w-0 flex-1 grid-cols-1 content-start gap-4 md:grid-cols-2">
						{isCnpj && (
							<div className="md:col-span-2">
								<InputField
									{...register("razaoSocial")}
									label="Razão Social"
									placeholder="Ex: Maré Alta Gastronomia e Eventos LTDA"
									disabled={isLocked}
								/>
								<FieldError message={errors.razaoSocial?.message} />
							</div>
						)}
						<div className="md:col-span-2">
							<InputField
								{...register("nome")}
								label={isCnpj ? "Nome Fantasia" : "Nome Completo"}
								disabled={isLocked}
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
										maskPlaceholder="(11) 99999-9999"
										disabled={isLocked}
									/>
								)}
							/>
							<FieldError message={errors.celular?.message} />
						</div>
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
									disabled={isLocked}
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
									disabled={isLocked}
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
									disabled={isLocked}
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
											disabled={isLocked}
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
									disabled={isLocked}
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
							disabled={isLocked}
						/>
						<FieldError message={errors.logradouro?.message} />
					</div>
					<div className="md:col-span-2">
						<InputField
							{...register("numero")}
							label="Número"
							disabled={isLocked}
						/>
						<FieldError message={errors.numero?.message} />
					</div>
					<div className="md:col-span-4">
						<InputField
							{...register("complemento")}
							label="Complemento (opcional)"
							disabled={isLocked}
						/>
					</div>
					<div className="md:col-span-2">
						<InputField
							{...register("bairro")}
							label="Bairro"
							disabled={isLocked}
						/>
						<FieldError message={errors.bairro?.message} />
					</div>
					<div className="md:col-span-3">
						<InputField
							{...register("cidade")}
							label="Cidade"
							disabled={isLocked}
						/>
						<FieldError message={errors.cidade?.message} />
					</div>
					<div className="md:col-span-1">
						<InputField
							{...register("estado")}
							label="UF"
							maxLength={2}
							disabled={isLocked}
						/>
						<FieldError message={errors.estado?.message} />
					</div>
				</div>

				{!isReadOnly && (
					<div className="pt-4">
						<Button
							type="submit"
							className="flex items-center gap-2"
							disabled={!(isDirty || photo.isChanged) || isBusy}
						>
							<Save size={18} />
							{isSavingPhoto || updateUserMutation.isPending
								? "Salvando..."
								: "Salvar Alterações"}
						</Button>
					</div>
				)}
			</form>
		</SettingsSection>
	);
};

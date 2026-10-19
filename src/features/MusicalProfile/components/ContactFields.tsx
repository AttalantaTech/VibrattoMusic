// src/components/forms/ContactFields/ContactFields.tsx
import { Fragment } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Briefcase, MapPin, Phone, ShieldUserIcon, User } from "lucide-react";
import {
	CEP_MASK,
	CNPJ_MASK,
	CPF_MASK,
	onlyDigits,
	PHONE_MASK,
	type ContactFormData,
} from "@/utils/validation";
import { InputField } from "@/components/forms/InputField/InputField";
import { ToggleSwitch } from "@/components/forms/ToggleSwitch/ToggleSwitch";

const helperText =
	"Essa informação será incluída no contrato com os seus clientes.";
const helpTextContact = "Caso não tenha sede, utilize o endereço residencial.";

function FieldError({ message }: { message?: string }) {
	if (!message) return null;
	return <div className="text-red-500 text-sm">{message}</div>;
}

interface ContactFieldsProps {
	form: UseFormReturn<ContactFormData>;
	onCepChange: (cep: string) => void | Promise<void>;
	/** Trava CPF e nome no modo pessoa física (ex.: dados vindos do cadastro) */
	lockPersonalData?: boolean;
}

export function ContactFields({
	form,
	onCepChange,
	lockPersonalData = false,
}: ContactFieldsProps) {
	const { control, watch, setValue, formState } = form;
	const { errors } = formState;
	const usaCnpj = watch("usaCnpj");

	return (
		<Fragment>
			<ToggleSwitch
				name="usaCnpj"
				checked={usaCnpj}
				setChecked={(checked: boolean) => {
					setValue("usaCnpj", checked, { shouldDirty: true });
				}}
				label="Usar CNPJ no contrato"
			/>

			{usaCnpj ? (
				<Fragment key="cnpj-mode">
					<Controller
						name="cnpj"
						control={control}
						render={({ field }) => (
							<InputField
								{...field}
								value={field.value ?? ""}
								required
								helperText={helperText}
								icon={<Briefcase size={20} />}
								label="CNPJ"
								mask={CNPJ_MASK}
								placeholder="XX.XXX.XXX/XXXX-00"
							/>
						)}
					/>
					<FieldError message={errors.cnpj?.message} />

					<Controller
						name="razaoSocial"
						control={control}
						render={({ field }) => (
							<InputField
								{...field}
								value={field.value ?? ""}
								helperText={helperText}
								icon={<User size={20} />}
								label="Nome Jurídico (Razão Social)"
								placeholder="Ex: Banda LTDA"
								required
							/>
						)}
					/>
					<FieldError message={errors.razaoSocial?.message} />

					<Controller
						name="nomeFantasia"
						control={control}
						render={({ field }) => (
							<InputField
								{...field}
								value={field.value ?? ""}
								helperText={helperText}
								icon={<ShieldUserIcon size={20} />}
								label="Nome Fantasia"
								required
							/>
						)}
					/>
					<FieldError message={errors.nomeFantasia?.message} />

					<Controller
						name="cpfResponsavelLegal"
						control={control}
						render={({ field }) => (
							<InputField
								{...field}
								value={field.value ?? ""}
								required
								helperText={helperText}
								icon={<Briefcase size={20} />}
								label="CPF do Responsável Legal"
								mask={CPF_MASK}
								placeholder="000.000.000-00"
							/>
						)}
					/>
					<FieldError message={errors.cpfResponsavelLegal?.message} />

					<Controller
						name="nomeResponsavelLegal"
						control={control}
						render={({ field }) => (
							<InputField
								{...field}
								value={field.value ?? ""}
								helperText={helperText}
								icon={<User size={20} />}
								label="Nome do Responsável Legal"
								placeholder="Ex: João da Silva"
								required
							/>
						)}
					/>
					<FieldError message={errors.nomeResponsavelLegal?.message} />
				</Fragment>
			) : (
				<Fragment key="cpf-mode">
					<Controller
						name="cpf"
						control={control}
						render={({ field }) => (
							<InputField
								{...field}
								value={field.value ?? ""}
								required
								disabled={lockPersonalData}
								helperText={helperText}
								icon={<Briefcase size={20} />}
								label="CPF"
								mask={CPF_MASK}
								placeholder="000.000.000-00"
							/>
						)}
					/>
					<FieldError message={errors.cpf?.message} />

					<Controller
						name="nome"
						control={control}
						render={({ field }) => (
							<InputField
								{...field}
								value={field.value ?? ""}
								required
								disabled={lockPersonalData}
								helperText={helperText}
								icon={<User size={20} />}
								label="Nome Completo"
							/>
						)}
					/>
					<FieldError message={errors.nome?.message} />
				</Fragment>
			)}

			<Controller
				name="telefone"
				control={control}
				render={({ field }) => (
					<InputField
						{...field}
						required={usaCnpj}
						icon={<Phone size={20} />}
						label="Telefone"
						mask={PHONE_MASK}
						placeholder="(00) 00000-0000"
					/>
				)}
			/>
			<FieldError message={errors.telefone?.message} />

			<Controller
				name="cepContato"
				control={control}
				render={({ field }) => (
					<InputField
						{...field}
						required={usaCnpj}
						helperText={helperText}
						icon={<MapPin size={20} />}
						label="CEP"
						mask={CEP_MASK}
						placeholder="00000-000"
						onChange={(event) => {
							const changed =
								onlyDigits(event.target.value) !==
								onlyDigits(field.value ?? "");
							field.onChange(event.target.value);
							if (changed) void onCepChange(event.target.value);
						}}
					/>
				)}
			/>

			<FieldError message={errors.cepContato?.message} />

			<Controller
				name="logradouroContato"
				control={control}
				render={({ field }) => (
					<InputField
						{...field}
						required={usaCnpj}
						helperText={`${helperText} ${helpTextContact}`}
						icon={<MapPin size={20} />}
						label="Endereço da Sede"
						placeholder="Digitar o endereço completo..."
					/>
				)}
			/>
			<FieldError message={errors.logradouroContato?.message} />

			<Controller
				name="numeroContato"
				control={control}
				render={({ field }) => (
					<InputField
						{...field}
						required={usaCnpj}
						label="Número"
						placeholder="123"
					/>
				)}
			/>
			<FieldError message={errors.numeroContato?.message} />

			<Controller
				name="complementoContato"
				control={control}
				render={({ field }) => (
					<InputField {...field} label="Complemento" placeholder="Apto 101" />
				)}
			/>

			<Controller
				name="bairroContato"
				control={control}
				render={({ field }) => (
					<InputField
						{...field}
						required={usaCnpj}
						label="Bairro"
						placeholder="Centro"
					/>
				)}
			/>
			<FieldError message={errors.bairroContato?.message} />

			<Controller
				name="cidadeContato"
				control={control}
				render={({ field }) => (
					<InputField
						{...field}
						required={usaCnpj}
						label="Cidade"
						placeholder="São Paulo"
					/>
				)}
			/>
			<FieldError message={errors.cidadeContato?.message} />

			<Controller
				name="estadoContato"
				control={control}
				render={({ field }) => (
					<InputField
						{...field}
						required={usaCnpj}
						label="Estado"
						placeholder="SP"
						maxLength={2}
					/>
				)}
			/>
			<FieldError message={errors.estadoContato?.message} />
		</Fragment>
	);
}

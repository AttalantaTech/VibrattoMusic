import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Loader2,
	Briefcase,
	Phone,
	MapPin,
	UserIcon,
	ShieldUserIcon,
	User,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import type { z } from "zod";
import { ContactValidationSchema } from "../../../../utils/validation";
import { Button } from "../../../ui/Button/Button";
import { InputField } from "../../../forms/InputField/InputField";
import { ToggleSwitch } from "../../../forms/ToggleSwitch/ToggleSwitch";
import { toast } from "sonner";
import { AccountLayout } from "../../layout/AccountLayout/AccountLayout";
import type { MusicalProductContact } from "@/api/types";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useUpdateMusicalProduct } from "@/hooks/useMusicalProducts";

// helper text matching Step1
const helperText =
	"Essa informação será incluída no contrato com os seus clientes.";

const helpTextContact = "Caso não tenha sede, utilize o endereço residencial.";

type ContactFormData = z.infer<typeof ContactValidationSchema>;

interface CepResponse {
	erro?: boolean;
	logradouro?: string;
	bairro?: string;
	localidade?: string;
	uf?: string;
}

export default function ContactSection() {
	const [loading, setLoading] = useState(false);

	const updateMusicalProductMutation = useUpdateMusicalProduct();

	const { activeProduct } = useMusicalProductStore();

	const values = useMemo(() => {
		return {
			usaCnpj: activeProduct?.usaCnpj ?? false,
			razaoSocial: activeProduct?.razaoSocial ?? "",
			nomeFantasia: activeProduct?.nomeFantasia || null,
			telefone: activeProduct?.telefone ?? "",
			cepContato: activeProduct?.cepContato ?? "",
			logradouroContato: activeProduct?.logradouroContato ?? "",
			numeroContato: activeProduct?.numeroContato ?? "",
			bairroContato: activeProduct?.bairroContato ?? "",
			cidadeContato: activeProduct?.cidadeContato ?? "",
			estadoContato: activeProduct?.estadoContato ?? "",
			cnpj: activeProduct?.cnpj ?? "",
			cpf: activeProduct?.cpf ?? "",
			nome: activeProduct?.nome ?? "",
			complementoContato: activeProduct?.complementoContato ?? "",
		};
	}, [activeProduct]);

	const { user } = useAuthStore();
	const { register, handleSubmit, watch, setValue, formState, reset, control } =
		useForm<ContactFormData>({
			resolver: zodResolver(ContactValidationSchema),
			defaultValues: { ...values },
		});
	const { errors } = formState;
	const watchUsaCnpj = watch("usaCnpj");

	const onSubmit = async (data: ContactFormData) => {
		setLoading(true);
		try {
			// Remove non-digit characters from telefone and ensure only 11 digits
			const cleanedTelefone = (data.telefone || "")
				.replace(/\D/g, "")
				.slice(0, 11);

			// Clean CEP to remove mask (only digits)
			const cleanedCep = (data.cepContato || "").replace(/\D/g, "");

			// Remove email field since it's not collected in this form, but add user's email
			const { ...contactData } = data;

			const cnpjreplaced = contactData.cnpj
				? contactData.cnpj?.replace(/\D/g, "")
				: null;

			const contact: MusicalProductContact = {
				id: activeProduct?.id ?? 0,
				...contactData,
				cnpj: watchUsaCnpj ? cnpjreplaced : null,
				telefone: cleanedTelefone,
				cepContato: cleanedCep,
				email: user?.email || "",
			};

			await updateMusicalProductMutation.mutateAsync({ ...contact });

			toast.success("Informações de contato salvas com sucesso");
		} catch (error: unknown) {
			console.error("Error saving contact data:", error);
			toast.error("Erro ao salvar informações de contato");
		} finally {
			setLoading(false);
		}
	};

	const handleCepChange = async (cep: string) => {
		if (cep.length === 8) {
			try {
				const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
				const data = (await response.json()) as CepResponse;
				if (!data.erro) {
					setValue("logradouroContato", data.logradouro ?? "");
					setValue("bairroContato", data.bairro ?? "");
					setValue("cidadeContato", data.localidade ?? "");
					setValue("estadoContato", data.uf ?? "");
				}
			} catch (error) {
				console.error("Erro ao buscar CEP:", error);
			}
		}
	};

	useEffect(() => {
		if (activeProduct) {
			reset({
				...values,
			});
		}
	}, [values, reset, activeProduct]);

	return (
		<AccountLayout
			headerTitle="Informações de contato"
			headerIcon={<UserIcon className="text-primary-700" size={24} />}
		>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col w-full h-full gap-6"
			>
				<ToggleSwitch
					name="usaCnpj"
					checked={watchUsaCnpj}
					setChecked={(checked: boolean) => {
						setValue("usaCnpj", checked);
					}}
					label="Usar CNPJ no contrato"
				/>

				{watchUsaCnpj ? (
					<>
						<Controller
							name="cnpj"
							control={control}
							render={({ field }) => (
								<InputField
									{...field}
									required={watchUsaCnpj}
									helperText={helperText}
									icon={<Briefcase size={20} />}
									label="CNPJ"
									mask="00.000.000/0000-00"
									placeholder="00.000.000/0000-00"
								/>
							)}
						/>
						{errors.cnpj?.message && (
							<div className="text-red-500 text-sm">{errors.cnpj.message}</div>
						)}

						<InputField
							required={watchUsaCnpj}
							helperText={helperText}
							icon={<User size={20} />}
							label="Nome Jurídico (Razão Social)"
							placeholder="Ex: Banda LTDA"
							{...register("razaoSocial")}
						/>
						{errors.razaoSocial?.message && (
							<div className="text-red-500 text-sm">
								{errors.razaoSocial.message}
							</div>
						)}

						<InputField
							required={watchUsaCnpj}
							helperText={helperText}
							icon={<ShieldUserIcon size={20} />}
							label="Nome Fantasia"
							{...register("nomeFantasia")}
						/>
						{errors.nomeFantasia?.message && (
							<div className="text-red-500 text-sm">
								{errors.nomeFantasia.message}
							</div>
						)}
					</>
				) : (
					<>
						<Controller
							name="cpf"
							control={control}
							render={({ field }) => (
								<InputField
									{...field}
									required={!watchUsaCnpj}
									helperText={helperText}
									icon={<Briefcase size={20} />}
									label="CPF"
									mask="000.000.000-00"
									placeholder="000.000.000-00"
								/>
							)}
						/>
						{errors.cpf?.message && (
							<div className="text-red-500 text-sm">{errors.cpf.message}</div>
						)}

						<InputField
							required={watchUsaCnpj}
							helperText={helperText}
							icon={<User size={20} />}
							label="Nome Completo"
							{...register("nome")}
						/>
						{errors.nome?.message && (
							<div className="text-red-500 text-sm">{errors.nome.message}</div>
						)}
					</>
				)}

				<Controller
					name="telefone"
					control={control}
					render={({ field }) => (
						<InputField
							{...field}
							required={watchUsaCnpj}
							icon={<Phone size={20} />}
							label="Telefone"
							mask="(00) 00000-0000"
							placeholder="(00) 00000-0000"
						/>
					)}
				/>
				{errors.telefone?.message && (
					<div className="text-red-500 text-sm">{errors.telefone.message}</div>
				)}

				<InputField
					required={watchUsaCnpj}
					helperText={helperText}
					icon={<MapPin size={20} />}
					label="CEP"
					placeholder="00000-000"
					{...register("cepContato")}
					onChange={(event) => {
						setValue("cepContato", event.target.value);
						void handleCepChange(event.target.value.replace(/\D/g, ""));
					}}
				/>
				{errors.cepContato?.message && (
					<div className="text-red-500 text-sm">
						{errors.cepContato.message}
					</div>
				)}

				<InputField
					required={watchUsaCnpj}
					helperText={`${helperText} ${helpTextContact}`}
					icon={<MapPin size={20} />}
					label="Endereço da Sede"
					placeholder="Digitar o endereço completo..."
					{...register("logradouroContato")}
				/>
				{errors.logradouroContato?.message && (
					<div className="text-red-500 text-sm">
						{errors.logradouroContato.message}
					</div>
				)}

				<InputField
					required={watchUsaCnpj}
					label="Número"
					placeholder="123"
					{...register("numeroContato")}
				/>
				{errors.numeroContato?.message && (
					<div className="text-red-500 text-sm">
						{errors.numeroContato.message}
					</div>
				)}

				<InputField
					label="Complemento"
					placeholder="Apto 101"
					{...register("complementoContato")}
				/>

				<InputField
					required={watchUsaCnpj}
					label="Bairro"
					placeholder="Centro"
					{...register("bairroContato")}
				/>
				{errors.bairroContato?.message && (
					<div className="text-red-500 text-sm">
						{errors.bairroContato.message}
					</div>
				)}

				<InputField
					required={watchUsaCnpj}
					label="Cidade"
					placeholder="São Paulo"
					{...register("cidadeContato")}
				/>
				{errors.cidadeContato?.message && (
					<div className="text-red-500 text-sm">
						{errors.cidadeContato.message}
					</div>
				)}

				<InputField
					required={watchUsaCnpj}
					label="Estado"
					placeholder="SP"
					maxLength={2}
					{...register("estadoContato")}
				/>
				{errors.estadoContato?.message && (
					<div className="text-red-500 text-sm">
						{errors.estadoContato.message}
					</div>
				)}

				{/* Navigation buttons */}
				<div className="flex flex-col sm:flex-row w-full gap-3 items-stretch sm:items-center justify-between mt-4 md:mt-6">
					<div className="w-full sm:w-auto">
						{/* Empty div for consistent layout - first step has no "Anterior" */}
					</div>
					<Button type="submit" disabled={loading} className="w-full sm:w-auto">
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

						<div className="flex items-center gap-1">
							{loading ? "Salvando..." : "Salvar"}
						</div>
					</Button>
				</div>
			</form>
		</AccountLayout>
	);
}

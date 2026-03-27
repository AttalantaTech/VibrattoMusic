import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Loader2,
	Briefcase,
	Phone,
	MapPin,
	UserIcon,
	ChevronRight,
	User,
} from "lucide-react";

import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import type { z } from "zod";
import type { OnboardingContactData } from "../../../utils/validation";
import {
	ContactValidationSchema,
	validateCNPJ,
} from "../../../utils/validation";
import { Button } from "../../ui/Button/Button";
import { InputField } from "../../forms/InputField/InputField";
import { ToggleSwitch } from "../../forms/ToggleSwitch/ToggleSwitch";
import { StepLayout } from "../layout/StepLayout/StepLayout";
import {
	useOnboardingData,
	useSaveOnboardingContact,
} from "../../../hooks/useMusicalProducts";
import { toast } from "sonner";
import type { OnboardingApiResponse } from "@/api/types";
import { decryptValue } from "@/utils/encryptValue";
import { useUser } from "@/hooks/useUser";

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

export default function ContactStep() {
	const { data } = useOnboardingData();
	const { data: userData } = useUser();

	const searchParameters = useSearch({ from: "/band/register/onboarding/1" });
	const onboardingID = searchParameters.registerId
		? decryptValue(searchParameters.registerId ?? "")
		: null;
	const onboardingType = searchParameters.type ?? null;

	const onboardingData = useMemo<OnboardingApiResponse | undefined>(() => {
		if (!data?.length) return undefined;

		if (onboardingType === "new-onboarding") return undefined;

		if (onboardingID)
			return data.find((item) => item.id === Number(onboardingID));

		return data[0];
	}, [data, onboardingID, onboardingType]);

	const { markStepComplete } = useOnboarding();
	const saveOnboardingContactMutation = useSaveOnboardingContact();

	const [loading, setLoading] = useState(false);
	const [buttonToggle, setButtonToggle] = useState<number>(0);

	const values = useMemo(() => {
		return {
			usaCnpj: onboardingData?.usaCnpj ?? false,
			razaoSocial: onboardingData?.razaoSocial ?? "",
			telefone: onboardingData?.telefone ?? "",
			cepContato: onboardingData?.cepContato ?? "",
			logradouroContato: onboardingData?.logradouroContato ?? "",
			numeroContato: onboardingData?.numeroContato ?? "",
			bairroContato: onboardingData?.bairroContato ?? "",
			cidadeContato: onboardingData?.cidadeContato ?? "",
			estadoContato: onboardingData?.estadoContato ?? "",
			cnpj: onboardingData?.cnpj ?? "",
			complementoContato: onboardingData?.complementoContato ?? "",
			cpf: onboardingData?.cpf ?? "",
			nome: onboardingData?.nome ?? "",
		};
	}, [onboardingData]);

	const { user } = useAuthStore();
	const { register, handleSubmit, watch, setValue, formState, reset, control } =
		useForm<ContactFormData>({
			resolver: zodResolver(ContactValidationSchema),
			defaultValues: { ...values },
		});
	const { errors } = formState;
	const navigate = useNavigate();
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

			const payload: OnboardingContactData = {
				id: onboardingData?.id ?? 0,
				...contactData,
				cnpj: contactData.cnpj?.replace(/\D/g, ""),
				telefone: cleanedTelefone,
				cepContato: cleanedCep,
				email: user?.email || "",
			};

			await saveOnboardingContactMutation.mutateAsync(payload);

			markStepComplete("1");

			toast.success("Informações de contato salvas com sucesso");

			// Navigate to next step
			await navigate({ to: "/band/register/onboarding/2" });
		} catch (error: unknown) {
			console.error("Error saving contact data:", error);
			toast.error("Erro ao salvar informações de contato");
		} finally {
			setLoading(false);
		}
	};

	const handleRegistrationDataButton = () => {
		const isCNPJ = validateCNPJ(userData?.cpfOuCnpj ?? "");

		setButtonToggle(buttonToggle + 1);

		if (buttonToggle % 2 === 0) {
			setValue("cepContato", userData?.cep ?? "");
			setValue("bairroContato", userData?.bairro ?? "");
			setValue("cidadeContato", userData?.cidade ?? "");
			setValue("complementoContato", userData?.complemento ?? "");
			setValue("numeroContato", userData?.numero ?? "");
			setValue("logradouroContato", userData?.logradouro ?? "");
			setValue("estadoContato", userData?.estado ?? "");
			setValue("logradouroContato", userData?.logradouro ?? "");
			setValue("telefone", userData?.telefone ?? "");

			if (isCNPJ) {
				setValue("razaoSocial", userData?.nome ?? "");
				setValue("cnpj", userData?.cpfOuCnpj ?? "");
			} else {
				setValue("nome", userData?.nome ?? "");
				setValue("cpf", userData?.cpfOuCnpj ?? "");
			}
			return;
		}

		setValue("cepContato", "");
		setValue("bairroContato", "");
		setValue("cidadeContato", "");
		setValue("complementoContato", "");
		setValue("numeroContato", "");
		setValue("logradouroContato", "");
		setValue("estadoContato", "");
		setValue("logradouroContato", "");
		setValue("telefone", "");

		if (isCNPJ) {
			setValue("razaoSocial", "");
			setValue("cnpj", "");
		} else {
			setValue("nome", "");
			setValue("cpf", "");
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
		reset({
			...values,
		});
	}, [values, reset]);

	return (
		<StepLayout
			currentStep={1}
			onClick={handleRegistrationDataButton}
			buttonTitle={
				buttonToggle % 2 === 0
					? "Usar Dados do Cadastro"
					: "Limpar Dados do Cadastro"
			}
			headerTitle="Informações de contato"
			headerIcon={<UserIcon color="#007bff" size={24} />}
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
							{loading ? "Salvando..." : "Continuar"}
							<ChevronRight />
						</div>
					</Button>
				</div>
			</form>
		</StepLayout>
	);
}

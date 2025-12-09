import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Loader2,
	Briefcase,
	User,
	Phone,
	MapPin,
	UserIcon,
	ChevronRight,
} from "lucide-react";

import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../../../store/authStore";
import type { z } from "zod";
import { ContactValidationSchema } from "../../../utils/validation";
import { Button } from "../../ui/Button/Button";
import { InputField } from "../../forms/InputField/InputField";
import { ToggleSwitch } from "../../forms/ToggleSwitch/ToggleSwitch";
import { StepLayout } from "../../BandRegister/layout/StepLayout/StepLayout";
import {
	useOnboardingData,
	useSaveOnboardingContact,
} from "../../../hooks/useMusicalProducts";
import type { OnboardingContact } from "@/api/types";
import { toast } from "sonner";

// helper text matching Step1
const helperText =
	"Essa informação será incluída no contrato com os seus clientes.";

const helpTextContact = "Caso não tenha sede, utilize o endereço residencial.";

type ContactFormData = Omit<
	z.infer<typeof ContactValidationSchema>,
	"nome" | "cpf"
>;

interface CepResponse {
	erro?: boolean;
	logradouro?: string;
	bairro?: string;
	localidade?: string;
	uf?: string;
}

export default function ContactStep() {
	const [loading, setLoading] = useState(false);

	const { data: onboardingData } = useOnboardingData();

	const { markStepComplete } = useOnboarding();
	const saveOnboardingContactMutation = useSaveOnboardingContact();

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
		};
	}, [onboardingData]);

	const { user } = useAuthStore();
	const { register, handleSubmit, watch, setValue, formState, reset } =
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

			const payload: OnboardingContact = {
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
		if (onboardingData) {
			reset({
				...values,
			});
		}
	}, [values, reset, onboardingData]);

	return (
		<StepLayout
			currentStep={1}
			headerTitle="Informações de contato"
			headerIcon={<UserIcon color="#007bff" size={24} />}
		>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col w-full h-full gap-6"
			>
				<InputField
					required
					helperText={helperText}
					icon={<User size={20} />}
					label="Nome Completo"
					disabled
					value={onboardingData?.usuario.nome || user?.nome || ""}
					placeholder="Ex: Marcio Almeida Pereira"
				/>

				<ToggleSwitch
					name="usaCnpj"
					checked={watchUsaCnpj}
					setChecked={(checked: boolean) => {
						setValue("usaCnpj", checked);
					}}
					label="Usar CNPJ no contrato"
				/>

				{watchUsaCnpj && (
					<>
						<InputField
							required
							helperText={helperText}
							icon={<Briefcase size={20} />}
							label="CNPJ"
							mask="99.999.999/0001-99"
							placeholder="XX.XXX.XXX/0001-XX"
							{...register("cnpj")}
						/>
						{errors.cnpj?.message && (
							<div className="text-red-500 text-sm">{errors.cnpj.message}</div>
						)}
					</>
				)}

				<InputField
					required
					helperText={helperText}
					icon={<Briefcase size={20} />}
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
					required
					icon={<Phone size={20} />}
					label="Telefone"
					mask="(99) 99999-9999"
					placeholder="(00) 00000-0000"
					{...register("telefone")}
				/>
				{errors.telefone?.message && (
					<div className="text-red-500 text-sm">{errors.telefone.message}</div>
				)}

				<InputField
					required
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
					required
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
					required
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
					required
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
					required
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
					required
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

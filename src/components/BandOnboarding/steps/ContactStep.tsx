import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	Loader2,
	Briefcase,
	User,
	Phone,
	MapPin,
	UserIcon,
} from "lucide-react";

import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { onboardingService } from "../../../api";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../../../store/authStore";
import type { z } from "zod";
import { ContactValidationSchema } from "../../../utils/validation";
import { Button } from "../../ui/Button/Button";
import { InputField } from "../../forms/InputField/InputField";
import { ToggleSwitch } from "../../forms/ToggleSwitch/ToggleSwitch";
import { StepLayout } from "../../BandRegister/layout/StepLayout/StepLayout";

// helper text matching Step1
const helperText =
	"Essa informação será incluída no contrato com os seus clientes.";

type ContactFormData = z.infer<typeof ContactValidationSchema>;

interface CepResponse {
	erro?: boolean;
	logradouro?: string;
	bairro?: string;
	localidade?: string;
	uf?: string;
}

export default function ContactStep() {
	const [loading, setLoading] = useState(false);
	const { updateData, markStepComplete, onboardingData, setProdutoMusicalId } =
		useOnboarding();
	const { user } = useAuthStore();
	const form = useForm<ContactFormData>({
		resolver: zodResolver(ContactValidationSchema),
		defaultValues: {
			usaCnpj: false,
			...onboardingData.contact,
		},
	});
	const { register, handleSubmit, watch, setValue, formState } = form;
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
			const { email, ...contactData } = data;

			const response = await onboardingService.createContact({
				...contactData,
				telefone: cleanedTelefone,
				cepContato: cleanedCep,
				email: user?.email || "",
			});

			// Store the ID in context
			const produtoMusicalId = String(response.id ?? 1);

			// Direct localStorage update for redundancy
			localStorage.setItem("produto-musical-id", produtoMusicalId);

			setProdutoMusicalId(produtoMusicalId);

			// Check localStorage after a brief delay
			setTimeout(() => {
				const storedValue = localStorage.getItem("produto-musical-id");
				if (storedValue !== produtoMusicalId) {
					console.error(
						"❌ ContactStep: localStorage value mismatch! Expected:",
						produtoMusicalId,
						"Got:",
						storedValue
					);
				}
			}, 100);

			// Update onboarding data and mark step complete
			updateData("contact", {
				...data,
				telefone: cleanedTelefone,
				cepContato: cleanedCep,
				email: user?.email || "",
			});
			markStepComplete("1");

			// Navigate to next step
			void navigate({ to: "/band/register/onboarding/2" });
		} catch (error: unknown) {
			console.error("Error saving contact data:", error);
			alert("Erro ao salvar informações de contato");
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
					form.setValue("logradouroContato", data.logradouro ?? "");
					form.setValue("bairroContato", data.bairro ?? "");
					form.setValue("cidadeContato", data.localidade ?? "");
					form.setValue("estadoContato", data.uf ?? "");
				}
			} catch (error) {
				console.error("Erro ao buscar CEP:", error);
			}
		}
	};
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
					placeholder="Ex: Marcio Almeida Pereira"
					{...register("nome")}
				/>
				{errors.nome?.message && (
					<div className="text-red-500 text-sm">{errors.nome.message}</div>
				)}

				<InputField
					required
					helperText={helperText}
					icon={<Briefcase size={20} />}
					label="CPF do Responsável"
					mask="999.999.999-99"
					placeholder="000.000.000-00"
					{...register("cpf")}
				/>
				{errors.cpf?.message && (
					<div className="text-red-500 text-sm">{errors.cpf.message}</div>
				)}

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
					helperText={helperText}
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
						{loading ? "Salvando..." : "Próximo"}
					</Button>
				</div>
			</form>
		</StepLayout>
	);
}

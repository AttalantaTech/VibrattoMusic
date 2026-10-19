import type {
	MusicalProductApiResponse,
	OnboardingApiResponse,
	UserApiResponse,
} from "@/api/types";
import type { ContactFormData } from "@/utils/validation";
import {
	ContactValidationSchema,
	validateAlphanumericCNPJ,
	validateCPF,
} from "@/utils/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface CepResponse {
	erro?: boolean;
	logradouro?: string;
	bairro?: string;
	localidade?: string;
	uf?: string;
}

interface UseContactStepForm {
	musicalProduct: MusicalProductApiResponse | OnboardingApiResponse | null;
	userData: UserApiResponse | undefined;
}
export function useContactStepForm({
	musicalProduct,
	userData,
}: UseContactStepForm) {
	const [loading, setLoading] = useState(false);
	const [buttonToggle, setButtonToggle] = useState<number>(0);

	const isCPF = validateCPF(userData?.cpfOuCnpj || "");

	const values = useMemo(() => {
		return {
			usaCnpj: musicalProduct?.usaCnpj ?? false,
			razaoSocial: musicalProduct?.razaoSocial ?? "",
			nomeFantasia: musicalProduct?.nomeFantasia || null,
			telefone: musicalProduct?.telefone ?? "",
			cepContato: musicalProduct?.cepContato ?? "",
			logradouroContato: musicalProduct?.logradouroContato ?? "",
			numeroContato: musicalProduct?.numeroContato ?? "",
			bairroContato: musicalProduct?.bairroContato ?? "",
			cidadeContato: musicalProduct?.cidadeContato ?? "",
			estadoContato: musicalProduct?.estadoContato ?? "",
			cnpj: musicalProduct?.cnpj ?? "",
			complementoContato: musicalProduct?.complementoContato ?? "",
			cpf: isCPF ? userData?.cpfOuCnpj : userData?.cpfResponsavelLegal || "",
			nome: isCPF ? userData?.nome : userData?.nomeResponsavelLegal,
			cpfResponsavelLegal: musicalProduct?.cpfResponsavelLegal ?? "",
			nomeResponsavelLegal: musicalProduct?.nomeResponsavelLegal ?? "",
		};
	}, [musicalProduct, userData, isCPF]);

	const form = useForm<ContactFormData>({
		resolver: zodResolver(ContactValidationSchema),
		defaultValues: { ...values },
		shouldUnregister: false,
	});

	useEffect(() => {
		form.reset({
			...values,
		});
	}, [values, form]);

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

	const handleRegistrationDataButton = () => {
		const isCNPJ = validateAlphanumericCNPJ(userData?.cpfOuCnpj ?? "");

		setButtonToggle(buttonToggle + 1);

		if (buttonToggle % 2 === 0) {
			form.setValue("cepContato", userData?.cep ?? "");
			form.setValue("bairroContato", userData?.bairro ?? "");
			form.setValue("cidadeContato", userData?.cidade ?? "");
			form.setValue("complementoContato", userData?.complemento ?? "");
			form.setValue("numeroContato", userData?.numero ?? "");
			form.setValue("logradouroContato", userData?.logradouro ?? "");
			form.setValue("estadoContato", userData?.estado ?? "");
			form.setValue("logradouroContato", userData?.logradouro ?? "");
			form.setValue("telefone", userData?.celular ?? "");

			if (isCNPJ) {
				form.setValue("razaoSocial", userData?.nome ?? "");
				form.setValue("cnpj", userData?.cpfOuCnpj ?? "");
				form.setValue(
					"cpfResponsavelLegal",
					userData?.cpfResponsavelLegal ?? ""
				);
				form.setValue(
					"nomeResponsavelLegal",
					userData?.nomeResponsavelLegal ?? ""
				);
			} else {
				form.setValue("nome", userData?.nome ?? "");
				form.setValue("cpf", userData?.cpfOuCnpj ?? "");
			}
			return;
		}

		form.setValue("cepContato", "");
		form.setValue("bairroContato", "");
		form.setValue("cidadeContato", "");
		form.setValue("complementoContato", "");
		form.setValue("numeroContato", "");
		form.setValue("logradouroContato", "");
		form.setValue("estadoContato", "");
		form.setValue("logradouroContato", "");
		form.setValue("telefone", "");

		if (isCNPJ) {
			form.setValue("razaoSocial", "");
			form.setValue("cnpj", "");
		}
	};

	return {
		form,
		handleCepChange,
		handleRegistrationDataButton,
		loading,
		setLoading,
		buttonToggle,
		setButtonToggle,
	};
}

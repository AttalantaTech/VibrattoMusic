import { useEffect, useState } from "react";
import type { RegisterFormData } from "../schemas/registerSchema";
import { registerSchema } from "../schemas/registerSchema";
import { addressService } from "@/api/services/addressService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const defaultValues: RegisterFormData = {
	email: "",
	nome: "",
	tipoDocumento: "cpf",
	cpfResponsavelLegal: "",
	nomeResponsavelLegal: "",
	cpfOuCnpj: "",
	celular: "",
	cep: "",
	logradouro: "",
	bairro: "",
	cidade: "",
	estado: "",
	numero: "",
	senha: "",
	confirmarSenha: "",
	complemento: "",
};

export function useRegisterForm() {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [showAddressFields, setShowAddressFields] = useState(false);
	const [isLoadingAddress, setIsLoadingAddress] = useState(false);

	const form = useForm<RegisterFormData>({
		defaultValues,
		resolver: zodResolver(registerSchema),
	});

	const cepValue = form.watch("cep");

	// Effect to handle CEP changes and fetch address data
	useEffect(() => {
		const fetchAddress = async () => {
			if (cepValue && cepValue.replace(/\D/g, "").length === 8) {
				setIsLoadingAddress(true);
				try {
					const addressData = await addressService.getAddressByCep(cepValue);
					form.setValue("logradouro", addressData.logradouro);
					form.setValue("bairro", addressData.bairro);
					form.setValue("cidade", addressData.cidade);
					form.setValue("estado", addressData.estado);
					form.setValue("complemento", addressData.complemento || "");
					setShowAddressFields(true);
				} catch {
					form.setError("cep", { message: "CEP não encontrado" });
					setShowAddressFields(false);
				} finally {
					setIsLoadingAddress(false);
				}
			} else if (cepValue && cepValue.replace(/\D/g, "").length < 8) {
				setShowAddressFields(false);
			}
		};

		const timeoutId = setTimeout(() => {
			void fetchAddress();
		}, 500); // Debounce
		return () => {
			clearTimeout(timeoutId);
		};
	}, [cepValue, form]);

	return {
		form,
		showPassword,
		setShowPassword,
		showConfirmPassword,
		setShowConfirmPassword,
		showAddressFields,
		setShowAddressFields,
		isLoadingAddress,
		setIsLoadingAddress,
	};
}

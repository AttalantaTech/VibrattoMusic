import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressService } from "@/api/services/addressService";
import type { UserApiResponse } from "@/api/types";
import {
	getDocumentType,
	profileSettingsSchema,
	type ProfileSettingsFormData,
} from "../schemas/settingsSchemas";
import {
	formatCep,
	formatCpf,
	formatDocument,
	formatPhone,
	onlyDigits,
} from "@/utils/validation";

const defaultValues: ProfileSettingsFormData = {
	nome: "",
	celular: "",
	tipoDocumento: "cpf",
	cpfOuCnpj: "",
	nomeResponsavelLegal: "",
	cpfResponsavelLegal: "",
	cep: "",
	logradouro: "",
	numero: "",
	complemento: "",
	bairro: "",
	cidade: "",
	estado: "",
};

const toFormValues = (user: UserApiResponse): ProfileSettingsFormData => ({
	nome: user.nome ?? "",
	// GET usuario returns the phone as "telefone"; PUT expects "celular"
	celular: formatPhone(user.celular ?? user.celular),
	tipoDocumento: getDocumentType(user.cpfOuCnpj),
	cpfOuCnpj: formatDocument(user.cpfOuCnpj),
	nomeResponsavelLegal: user.nomeResponsavelLegal ?? "",
	cpfResponsavelLegal: formatCpf(user.cpfResponsavelLegal),
	cep: formatCep(user.cep),
	logradouro: user.logradouro ?? "",
	numero: user.numero ?? "",
	complemento: user.complemento ?? "",
	bairro: user.bairro ?? "",
	cidade: user.cidade ?? "",
	estado: user.estado ?? "",
});

export function useProfileSettingsForm(userData?: UserApiResponse) {
	const [isLoadingAddress, setIsLoadingAddress] = useState(false);

	const form = useForm<ProfileSettingsFormData>({
		defaultValues,
		resolver: zodResolver(profileSettingsSchema),
	});
	const { reset, setValue, setError, clearErrors, getValues } = form;

	// Fill the form with the current data as soon as it arrives from the API
	useEffect(() => {
		if (userData) reset(toFormValues(userData));
	}, [userData, reset]);

	// Called by the CEP input on user typing only, so loading the saved data
	// never overwrites the address (number/complement) with ViaCEP values
	const lookupAddress = async (cep: string) => {
		if (onlyDigits(cep).length !== 8) return;

		setIsLoadingAddress(true);
		try {
			const address = await addressService.getAddressByCep(cep);
			const options = { shouldDirty: true, shouldValidate: true };

			setValue("logradouro", address.logradouro, options);
			setValue("bairro", address.bairro, options);
			setValue("cidade", address.cidade, options);
			setValue("estado", address.estado, options);
			if (!getValues("complemento")) {
				setValue("complemento", address.complemento ?? "", options);
			}
			clearErrors("cep");
		} catch {
			setError("cep", { message: "CEP não encontrado" });
		} finally {
			setIsLoadingAddress(false);
		}
	};

	return { form, isLoadingAddress, lookupAddress };
}

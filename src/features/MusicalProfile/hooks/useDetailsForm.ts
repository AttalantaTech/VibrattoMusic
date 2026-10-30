import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useUpdateMusicalProduct } from "@/hooks/useMusicalProducts";
import { detailsSchema, type DetailsFormData } from "../schemas/detailsSchema";
import type { Option } from "@/components/forms/Select/Select";
import { VibrattoApiError } from "@/api";
import type { OnboardingApiResponse } from "@/api/types";
import { useSaveOnboardingDetails } from "@/hooks/useOnboarding";
import { useNavigate } from "@tanstack/react-router";
import { useOnboarding } from "@/contexts/hooks/useOnboarding";
import { useBandRegistration } from "@/contexts/BandRegistrationContext";
import { encryptValue } from "@/utils/encryptValue";

interface UseDetailsFormProps {
	musicalProduct: OnboardingApiResponse | null;
}
export function useDetailsForm({ musicalProduct }: UseDetailsFormProps) {
	const navigate = useNavigate();

	const updateMusicalProductMutation = useUpdateMusicalProduct();
	const saveOnboardingDetails = useSaveOnboardingDetails();

	const { updateData, markStepComplete } = useOnboarding();
	const { state } = useBandRegistration();

	const profileTypeId = state.profileTypes.find((item) => item)?.value;
	const produtoMusicalId = musicalProduct ? musicalProduct.id : 0;

	const [loading, setLoading] = useState(false);

	const [selectedCategoria, setSelectedCategoria] = useState<Array<Option>>([]);
	const [selectedCidade, setSelectedCidade] = useState<Array<Option>>([]);
	const [selectedGenres, setSelectedGenres] = useState<Array<Option>>([]);
	const [selectedEventTypes, setSelectedEventTypes] = useState<Array<Option>>(
		[]
	);

	const [searchCity, setSearchCity] = useState("");

	const [cityPage, setCityPage] = useState(1);
	const [hasMoreCities, setHasMoreCities] = useState(true);

	const defaultValues = useMemo(
		(): DetailsFormData => ({
			nome: musicalProduct?.nome ?? "",
			idCategoria:
				musicalProduct?.categoria.id ||
				(profileTypeId && parseInt(profileTypeId)) ||
				0,
			descricao: musicalProduct?.descricao ?? "",
			podeDeslocamento: musicalProduct?.podeDeslocamento ?? false,
			codigoMunicipio: musicalProduct?.cidade.id ?? 0,
			tipoEvento: musicalProduct?.tipoEvento.map((index) => index.id) ?? [],
			generoMusical:
				musicalProduct?.generoMusical.map((index) => index.id) ?? [],
			tipoProducao:
				musicalProduct?.tiposProducao.map((index) => index.id) ?? [],
			numeroIntegrantes: musicalProduct?.numeroIntegrantes ?? 0,
		}),
		[musicalProduct, profileTypeId]
	);

	const form = useForm<DetailsFormData>({
		resolver: zodResolver(detailsSchema),
		defaultValues,
	});

	useEffect(() => {
		if (!musicalProduct) return;

		if (musicalProduct.categoria.id > 0) {
			setSelectedCategoria([
				{
					value: String(musicalProduct.categoria.id),
					label: musicalProduct.categoria.nome,
				},
			]);
		}

		if (musicalProduct.cidade.id > 0) {
			setSelectedCidade([
				{
					value: String(musicalProduct.cidade.id),
					label: musicalProduct.cidade.nome,
				},
			]);
		}

		setSelectedGenres(
			musicalProduct.generoMusical.map((event) => ({
				value: String(event.id),
				label: event.nome,
			}))
		);

		setSelectedEventTypes(
			musicalProduct.tipoEvento.map((event) => ({
				value: String(event.id),
				label: event.nome,
			}))
		);
	}, [musicalProduct]);

	// A new profile has no category yet: show the one chosen at
	// /band/profile-type. It was already the form value (idCategoria), but the
	// select displays selectedCategoria, which only came from saved profiles
	useEffect(() => {
		if ((musicalProduct?.categoria.id ?? 0) > 0) return;

		const chosenType = state.profileTypes.find((item) => item);
		if (!chosenType) return;

		setSelectedCategoria((current) =>
			current.length > 0 ? current : [chosenType]
		);
	}, [musicalProduct, state.profileTypes]);

	useEffect(() => {
		form.reset(defaultValues);
	}, [form, defaultValues]);

	const onSubmitEdit = async (data: DetailsFormData) => {
		setLoading(true);
		try {
			await updateMusicalProductMutation.mutateAsync({
				id: musicalProduct?.id,
				...data,
				tipoProducao: data.tipoProducao ?? [],
				numeroIntegrantes: data.numeroIntegrantes ?? 0,
			});

			toast.success("Informações da Banda salvas com sucesso");
		} catch (error) {
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
					return;
				} else if (errorMessage) {
					toast.error(errorMessage);
					return;
				}
				toast.error("Aconteceu um erro ao tentar processar sua solicitação.");
				return;
			}
		} finally {
			setLoading(false);
		}
	};

	const onSubmitOnboarding = async (data: DetailsFormData) => {
		setLoading(true);
		try {
			const detailsData = {
				nome: data.nome,
				idCategoria: data.idCategoria,
				descricao: data.descricao,
				podeDeslocamento: data.podeDeslocamento,
				codigoMunicipio: data.codigoMunicipio,
				tipoEvento: data.tipoEvento,
				generoMusical: data.generoMusical,
				tipoProducao: data.tipoProducao ?? [],
				numeroIntegrantes: data.numeroIntegrantes ?? 0,
			};

			await saveOnboardingDetails.mutateAsync({
				productId: produtoMusicalId,
				detailsData,
			});

			updateData("details", data);
			markStepComplete("2");

			toast.success("Informações da Banda salvas com sucesso");

			const search = musicalProduct?.id
				? {
						registerId: encryptValue(musicalProduct.id.toString()),
					}
				: {};

			await navigate({
				to: "/band/register/onboarding/3",
				search,
			});
		} catch (error) {
			if (error instanceof VibrattoApiError) {
				const errorMessage = error.data?.erros.find((error_) => error_);

				if (error.statusCode === 500) {
					toast.error(
						"Erro interno do servidor. Por favor, verifique os dados e tente novamente."
					);
					return;
				} else if (errorMessage) {
					toast.error(errorMessage);
					return;
				}
				toast.error("Aconteceu um erro ao tentar processar sua solicitação.");
				return;
			}
		} finally {
			setLoading(false);
		}
	};

	return {
		form,
		loading,

		selectedCategoria,
		setSelectedCategoria,

		selectedCidade,
		setSelectedCidade,

		selectedGenres,
		setSelectedGenres,

		selectedEventTypes,
		setSelectedEventTypes,

		searchCity,
		setSearchCity,
		cityPage,
		setCityPage,
		hasMoreCities,
		setHasMoreCities,

		onSubmitEdit: form.handleSubmit(onSubmitEdit),
		onSubmitOnboarding: form.handleSubmit(onSubmitOnboarding),
	};
}

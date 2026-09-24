import { useEffect, useMemo } from "react";

import {
	ChevronLeft,
	ChevronRight,
	Loader2,
	Music,
	Info,
	User,
} from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { OnboardingApiResponse } from "../../../api/types";
import { StepLayout } from "../layout/StepLayout/StepLayout";
import { InputField } from "../../forms/InputField/InputField";
import { Select } from "../../forms/Select/Select";
import { ToggleSwitch } from "../../forms/ToggleSwitch/ToggleSwitch";
import { TextAreaField } from "../../forms/TextAreaField/TextAreaField";
import { Button } from "../../ui/Button/Button";
import { useOnboardingData } from "../../../hooks/useOnboarding";
import { decryptValue, encryptValue } from "@/utils/encryptValue";
import { useFilterLookup } from "@/domains/MusicalProfile/hooks/useFilterLookup";
import { useDetailsForm } from "@/domains/MusicalProfile/hooks/useDetailsForm";

export default function DetailsStep() {
	const { data } = useOnboardingData();

	const searchParameters = useSearch({ from: "/band/register/onboarding/2" });
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

	const navigate = useNavigate();

	const {
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
		setHasMoreCities,
		hasMoreCities,
		onSubmitOnboarding,
	} = useDetailsForm({ musicalProduct: onboardingData || null });

	const {
		categoryOptions,
		cityOptions,
		eventTypeOptions,
		musicalGenreOptions,
		isLoadingCategories,
		isLoadingEventTypes,
		isLoadingGenresMusical,
		isLoadingCities,
		isFetchingCities,
	} = useFilterLookup({
		cityPage,
		setCityPage,
		setHasMoreCities,
		hasMoreCities,
		cityPageSize: 20,
		searchCityByName: searchCity,
	});

	useEffect(() => {
		setCityPage(1);
		setHasMoreCities(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchCity]);

	const { setValue, watch, formState } = form;

	return (
		<StepLayout
			currentStep={2}
			headerTitle="Informações da Banda"
			headerIcon={<Info className="text-primary-700" size={24} />}
		>
			<form
				onSubmit={onSubmitOnboarding}
				className="flex flex-col w-full h-full gap-6"
			>
				<InputField
					icon={<Music size={20} />}
					label="Nome Artístico"
					name="artistic_name"
					placeholder="Digitar..."
					value={watch("nome") || ""}
					onChange={(event) => {
						setValue("nome", event.target.value);
					}}
				/>
				{formState.errors.nome && (
					<div className="text-red-500 text-sm">
						{formState.errors.nome.message}
					</div>
				)}{" "}
				<Select
					label="Categoria"
					name="categoria"
					options={categoryOptions}
					placeholder={
						isLoadingCategories ? "Carregando..." : "Selecione uma categoria"
					}
					selectedOptions={selectedCategoria}
					setSelectedOptions={(options) => {
						setSelectedCategoria(options);
						if (options && options.length > 0) {
							setValue("idCategoria", Number(options[0]?.value));
						}
					}}
				/>
				{formState.errors.idCategoria && (
					<div className="text-red-500 text-sm">
						{formState.errors.idCategoria.message}
					</div>
				)}
				<Select
					label="Cidade"
					name="cidade"
					options={cityOptions}
					placeholder={
						isLoadingCities ? "Carregando..." : "Selecione uma cidade"
					}
					selectedOptions={selectedCidade}
					setSelectedOptions={(options) => {
						setSelectedCidade(options);
						if (options && options.length > 0) {
							setValue("codigoMunicipio", Number(options[0]?.value));
						}
					}}
					searchTerm={searchCity}
					setSearchTerm={setSearchCity}
					onReachEnd={() => {
						if (!hasMoreCities || isFetchingCities) {
							return;
						}

						setCityPage((previous) => previous + 1);
					}}
					isLoading={isFetchingCities}
				/>
				{formState.errors.codigoMunicipio && (
					<div className="text-red-500 text-sm">
						{formState.errors.codigoMunicipio.message}
					</div>
				)}
				<Select
					label="Gênero Musical"
					name="genres"
					multiple
					options={musicalGenreOptions}
					placeholder={
						isLoadingGenresMusical ? "Carregando..." : "Selecione os gêneros"
					}
					selectedOptions={selectedGenres}
					setSelectedOptions={(options) => {
						setSelectedGenres(options);
						const values = (options || []).map((opt) => Number(opt.value));
						setValue("generoMusical", values);
					}}
				/>
				{formState.errors.generoMusical && (
					<div className="text-red-500 text-sm">
						{formState.errors.generoMusical.message}
					</div>
				)}
				<Select
					label="Tipos de Eventos"
					name="events"
					multiple
					options={eventTypeOptions}
					placeholder={
						isLoadingEventTypes
							? "Carregando..."
							: "Selecione os tipos de evento"
					}
					selectedOptions={selectedEventTypes}
					setSelectedOptions={(options) => {
						setSelectedEventTypes(options);
						const values = (options || []).map((opt) => Number(opt.value));
						setValue("tipoEvento", values);
					}}
				/>
				{formState.errors.tipoEvento && (
					<div className="text-red-500 text-sm">
						{formState.errors.tipoEvento.message}
					</div>
				)}
				<hr className="w-full" />
				<ToggleSwitch
					checked={watch("podeDeslocamento") || false}
					label="Disponível para deslocamentos a outras regiões."
					name="avaliable_for_moving"
					setChecked={(checked) => {
						setValue("podeDeslocamento", checked);
					}}
				/>
				<hr className="w-full" />
				<InputField
					icon={<User size={20} />}
					label="Número de integrantes da banda"
					min={1}
					placeholder="Ex: 3"
					type="number"
					name="numberBandMembers"
					value={String(watch("numeroIntegrantes")) || ""}
					onChange={(event) => {
						setValue("numeroIntegrantes", Number(event.target.value));
					}}
				/>
				<TextAreaField
					showCharCount
					helperText="Conte brevemente a trajetória da banda em até 300 caracteres."
					label="Bio (release)"
					name="bio"
					placeholder="Digitar..."
					value={watch("descricao") || ""}
					onChange={(event) => {
						setValue("descricao", event.target.value);
					}}
				/>
				{formState.errors.descricao && (
					<div className="text-red-500 text-sm">
						{formState.errors.descricao.message}
					</div>
				)}{" "}
				{/* Navigation buttons */}
				<div className="flex flex-col sm:flex-row w-full gap-8 items-stretch sm:items-center justify-end mt-4 md:mt-6">
					<Button
						type="button"
						variant="outline"
						className="w-full sm:w-auto"
						onClick={async () => {
							const search = onboardingData?.id
								? {
										registerId: encryptValue(onboardingData.id.toString()),
									}
								: {};

							await navigate({
								to: "/band/register/onboarding/1",
								search,
							});
						}}
					>
						<div className="flex items-center gap-1">
							<ChevronLeft />
							Voltar
						</div>
					</Button>

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

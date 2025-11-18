import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// TODO: Implement proper toast system
// import { useToast } from "../../ui/use-toast";
import { Loader2, Music, User } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useOnboarding } from "../../../contexts/hooks/useOnboarding";
import { onboardingService, filterService } from "../../../api";
import type { FilterOption } from "../../../api/types";
import { StepLayout } from "../../BandRegister/layout/StepLayout/StepLayout";
import { InputField } from "../../forms/InputField/InputField";
import { Select, type Option } from "../../forms/Select/Select";
import { ToggleSwitch } from "../../forms/ToggleSwitch/ToggleSwitch";
import { TextAreaField } from "../../forms/TextAreaField/TextAreaField";
import { Button } from "../../ui/Button/Button";

const detailsSchema = z.object({
	nome: z.string().min(1, "Nome é obrigatório"),
	idCategoria: z.number().min(1, "Categoria é obrigatória"),
	descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
	podeDeslocamento: z.boolean().default(false),
	codigoMunicipio: z.number().min(1, "Cidade é obrigatória"),
	tipoEvento: z
		.array(z.number())
		.min(1, "Selecione pelo menos um tipo de evento"),
	generoMusical: z
		.array(z.number())
		.min(1, "Selecione pelo menos um gênero musical"),
	tipoProducao: z.array(z.number()).optional(),
});

type DetailsFormData = z.infer<typeof detailsSchema>;

export default function DetailsStep() {
	const [loading, setLoading] = useState(false);
	const [categories, setCategories] = useState<Array<FilterOption>>([]);
	const [cities, setCities] = useState<Array<FilterOption>>([]);
	const [eventTypes, setEventTypes] = useState<Array<FilterOption>>([]);
	const [musicalGenres, setMusicalGenres] = useState<Array<FilterOption>>([]);

	// Loading states for dropdowns
	const [loadingCategories, setLoadingCategories] = useState(true);
	const [loadingCities, setLoadingCities] = useState(true);
	const [loadingEventTypes, setLoadingEventTypes] = useState(true);
	const [loadingGenres, setLoadingGenres] = useState(true);

	// State for multi-select options
	const [selectedCategoria, setSelectedCategoria] = useState<Array<Option>>([]);
	const [selectedCidade, setSelectedCidade] = useState<Array<Option>>([]);
	const [selectedGenres, setSelectedGenres] = useState<Array<Option>>([]);
	const [selectedEventTypes, setSelectedEventTypes] = useState<Array<Option>>(
		[]
	);
	const [numberOfMembers, setNumberOfMembers] = useState<number>(0);

	const navigate = useNavigate();
	// TODO: Implement proper toast system
	// const { toast } = useToast();
	const {
		updateData,
		markStepComplete,
		onboardingData,
		produtoMusicalId,
		_debugProviderId,
	} = useOnboarding();

	console.log("🔍 DetailsStep: Component rendered");
	console.log(
		"🔍 DetailsStep: produtoMusicalId from context:",
		produtoMusicalId
	);
	console.log("🔍 DetailsStep: Provider ID:", _debugProviderId);
	console.log("🔍 DetailsStep: onboardingData:", onboardingData);

	useEffect(() => {
		console.log(
			"🔄 DetailsStep: produtoMusicalId changed to:",
			produtoMusicalId
		);
		const storedValue = localStorage.getItem("produto-musical-id");
		console.log("🔍 DetailsStep: localStorage value:", storedValue);

		// If localStorage has a value but context doesn't, try to use it
		if (storedValue && !produtoMusicalId) {
			console.log(
				"⚠️ DetailsStep: localStorage has value but context doesn't!"
			);
			console.log(
				"🔄 DetailsStep: Will try to use localStorage value:",
				storedValue
			);
			// We can't update the context here because we don't have the setter
		}
	}, [produtoMusicalId]);

	const form = useForm<DetailsFormData>({
		resolver: zodResolver(detailsSchema),
		defaultValues: onboardingData["details"] ?? {
			nome: "",
			idCategoria: 0,
			descricao: "",
			podeDeslocamento: false,
			codigoMunicipio: 0,
			tipoEvento: [],
			generoMusical: [],
			tipoProducao: [],
		},
	});

	// Transform API data to select options with proper null checks
	const categoriaOptions: Array<Option> = (categories || []).map((cat) => ({
		value: cat.Id.toString(),
		label: cat.Nome,
	}));

	const cidadeOptions: Array<Option> = (cities || []).map((cidade) => ({
		value: cidade.Id.toString(),
		label: cidade.Nome,
	}));

	const tipoEventoOptions: Array<Option> = (eventTypes || []).map((tipo) => ({
		value: tipo.Id.toString(),
		label: tipo.Nome,
	}));

	const generoMusicalOptions: Array<Option> = (musicalGenres || []).map(
		(genero) => ({
			value: genero.Id.toString(),
			label: genero.Nome,
		})
	);
	const loadFilters = useCallback(async () => {
		try {
			setLoadingCategories(true);
			setLoadingCities(true);
			setLoadingEventTypes(true);
			setLoadingGenres(true);

			const [
				categoriesResponse,
				citiesResponse,
				eventTypesResponse,
				genresResponse,
			] = await Promise.all([
				filterService.getCategorias(),
				filterService.getCidades(),
				filterService.getTiposEvento(),
				filterService.getGenerosMusicais(),
			]);

			setCategories(categoriesResponse ?? []);
			setCities(citiesResponse ?? []);
			setEventTypes(eventTypesResponse ?? []);
			setMusicalGenres(genresResponse ?? []);
		} catch (loadError) {
			console.error("Failed to load filters:", loadError);
			// TODO: Replace with proper toast system
			alert("Erro ao carregar filtros");
		} finally {
			setLoadingCategories(false);
			setLoadingCities(false);
			setLoadingEventTypes(false);
			setLoadingGenres(false);
		}
	}, []); // Removed toast dependency as it's no longer used

	useEffect(() => {
		void loadFilters();
	}, [loadFilters]);
	// Initialize select fields with previously saved data
	useEffect(() => {
		const details = onboardingData["details"] as DetailsFormData | undefined;
		if (
			details &&
			categories.length &&
			cities.length &&
			eventTypes.length &&
			musicalGenres.length
		) {
			// Initialize categoria
			if (details.idCategoria) {
				const categoriaOption = categories.find(
					(cat) => cat.Id === details.idCategoria.toString()
				);
				if (categoriaOption) {
					setSelectedCategoria([
						{
							value: categoriaOption.Id.toString(),
							label: categoriaOption.Nome,
						},
					]);
				}
			}

			// Initialize cidade
			if (details.codigoMunicipio) {
				const cidadeOption = cities.find(
					(cidade) => cidade.Id === details.codigoMunicipio.toString()
				);
				if (cidadeOption) {
					setSelectedCidade([
						{ value: cidadeOption.Id.toString(), label: cidadeOption.Nome },
					]);
				}
			}

			// Initialize genres
			if (details.generoMusical?.length) {
				const genreOptions = details.generoMusical
					.map((id: number) => musicalGenres.find((genero) => genero.Id === id.toString()))
					.filter((genero): genero is FilterOption => genero !== undefined)
					.map((genero) => ({
						value: genero.Id.toString(),
						label: genero.Nome,
					}));
				setSelectedGenres(genreOptions);
			}

			// Initialize event types
			if (details.tipoEvento?.length) {
				const eventOptions = details.tipoEvento
					.map((id: number) => eventTypes.find((tipo) => tipo.Id === id.toString()))
					.filter((tipo): tipo is FilterOption => tipo !== undefined)
					.map((tipo) => ({ value: tipo.Id.toString(), label: tipo.Nome }));
				setSelectedEventTypes(eventOptions);
			}
		}
	}, [onboardingData, categories, cities, eventTypes, musicalGenres]);
	const onSubmit = async (data: DetailsFormData) => {
		console.log("🚀 DetailsStep: Form submitted with data:", data);
		console.log("🔍 DetailsStep: produtoMusicalId check:", produtoMusicalId);
		console.log("🔍 DetailsStep: Provider ID:", _debugProviderId);

		// Try to get ID from context or localStorage
		let idToUse = produtoMusicalId;

		// If not in context, check localStorage
		if (!idToUse) {
			const storedValue = localStorage.getItem("produto-musical-id");
			console.log("🔍 DetailsStep: Checking localStorage:", storedValue);

			if (storedValue) {
				console.log(
					"🔄 DetailsStep: Using localStorage value instead of context"
				);
				idToUse = storedValue;
			} else {
				console.error(
					"❌ DetailsStep: No produtoMusicalId found in context or localStorage!"
				);
				// TODO: Replace with proper toast system
				alert(
					"ID do produto musical não encontrado. Por favor, volte e preencha o formulário de contato novamente."
				);
				return;
			}
		}

		console.log("📡 DetailsStep: Starting API call with ID:", Number(idToUse));
		setLoading(true);
		try {
			await onboardingService.updateDetails(Number(idToUse), {
				nome: data.nome,
				idCategoria: data.idCategoria,
				descricao: data.descricao,
				podeDeslocamento: data.podeDeslocamento,
				codigoMunicipio: data.codigoMunicipio,
				tipoEvento: data.tipoEvento,
				generoMusical: data.generoMusical,
				tipoProducao: data.tipoProducao ?? [],
			});
			updateData("details", data);
			markStepComplete("2");
			// TODO: Replace with proper toast system

			void navigate({ to: "/band/register/onboarding/3" });
		} catch (submitError) {
			console.error("Failed to submit details:", submitError);
			const errorMessage =
				submitError instanceof Error
					? submitError.message
					: "Erro ao salvar detalhes"; // TODO: Replace with proper toast system
			console.error("❌ Erro ao salvar detalhes:", errorMessage);
			alert(errorMessage);
		} finally {
			setLoading(false);
		}
	};
	return (
		<StepLayout
			currentStep={2}
			headerTitle="Informações Profissionais"
			headerIcon={<Music color="#007bff" size={24} />}
		>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col w-full h-full gap-6"
			>
				<InputField
					icon={<Music size={20} />}
					label="Nome Artístico"
					name="artistic_name"
					placeholder="Digitar..."
					value={form.watch("nome") || ""}
					onChange={(event) => {
						form.setValue("nome", event.target.value);
					}}
				/>
				{form.formState.errors.nome && (
					<div className="text-red-500 text-sm">
						{form.formState.errors.nome.message}
					</div>
				)}{" "}
				<Select
					label="Categoria"
					name="categoria"
					options={categoriaOptions}
					placeholder={
						loadingCategories ? "Carregando..." : "Selecione uma categoria"
					}
					selectedOptions={selectedCategoria}
					setSelectedOptions={(options) => {
						setSelectedCategoria(options);
						if (options && options.length > 0) {
							form.setValue("idCategoria", Number(options[0]?.value));
						}
					}}
				/>
				{form.formState.errors.idCategoria && (
					<div className="text-red-500 text-sm">
						{form.formState.errors.idCategoria.message}
					</div>
				)}
				<Select
					label="Cidade"
					name="cidade"
					options={cidadeOptions}
					placeholder={loadingCities ? "Carregando..." : "Selecione uma cidade"}
					selectedOptions={selectedCidade}
					setSelectedOptions={(options) => {
						setSelectedCidade(options);
						if (options && options.length > 0) {
							form.setValue("codigoMunicipio", Number(options[0]?.value));
						}
					}}
				/>
				{form.formState.errors.codigoMunicipio && (
					<div className="text-red-500 text-sm">
						{form.formState.errors.codigoMunicipio.message}
					</div>
				)}
				<Select
					label="Gênero Musical"
					name="genres"
					options={generoMusicalOptions}
					placeholder={loadingGenres ? "Carregando..." : "Selecione os gêneros"}
					selectedOptions={selectedGenres}
					setSelectedOptions={(options) => {
						setSelectedGenres(options);
						const values = (options || []).map((opt) => Number(opt.value));
						form.setValue("generoMusical", values);
					}}
				/>
				{form.formState.errors.generoMusical && (
					<div className="text-red-500 text-sm">
						{form.formState.errors.generoMusical.message}
					</div>
				)}
				<Select
					label="Tipos de Eventos"
					name="events"
					options={tipoEventoOptions}
					placeholder={
						loadingEventTypes ? "Carregando..." : "Selecione os tipos de evento"
					}
					selectedOptions={selectedEventTypes}
					setSelectedOptions={(options) => {
						setSelectedEventTypes(options);
						const values = (options || []).map((opt) => Number(opt.value));
						form.setValue("tipoEvento", values);
					}}
				/>
				{form.formState.errors.tipoEvento && (
					<div className="text-red-500 text-sm">
						{form.formState.errors.tipoEvento.message}
					</div>
				)}
				<hr className="w-full" />
				<ToggleSwitch
					checked={form.watch("podeDeslocamento") || false}
					label="Disponível para deslocamentos a outras regiões."
					name="avaliable_for_moving"
					setChecked={(checked) => {
						form.setValue("podeDeslocamento", checked);
					}}
				/>
				<hr className="w-full" />
				<InputField
					icon={<User size={20} />}
					label="Número de integrantes da banda"
					min={1}
					name="num_members"
					placeholder="Ex: 3"
					type="number"
					value={numberOfMembers}
					onChange={(event) => {
						setNumberOfMembers(parseInt(event.target.value) || 0);
					}}
				/>
				<TextAreaField
					showCharCount
					helperText="Conte brevemente a trajetória da banda em até 300 caracteres."
					label="Bio (release)"
					name="bio"
					placeholder="Digitar..."
					value={form.watch("descricao") || ""}
					onChange={(event) => {
						form.setValue("descricao", event.target.value);
					}}
				/>
				{form.formState.errors.descricao && (
					<div className="text-red-500 text-sm">
						{form.formState.errors.descricao.message}
					</div>
				)}{" "}
				{/* Navigation buttons */}
				<div className="flex flex-col sm:flex-row w-full gap-3 items-stretch sm:items-center justify-between mt-4 md:mt-6">
					<Button
						type="button"
						variant="outline"
						className="w-full sm:w-auto"
						onClick={() => navigate({ to: "/band/register/onboarding/1" })}
					>
						Anterior
					</Button>

					<Button type="submit" disabled={loading} className="w-full sm:w-auto">
						{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{loading ? "Salvando..." : "Próximo"}
					</Button>
				</div>
			</form>
		</StepLayout>
	);
}

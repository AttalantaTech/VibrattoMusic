import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { Label } from "@/components/ui/Label/Label";
import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DatePicker } from "@/components/Calendar/DatePicker";
import type { Option } from "@/components/forms/Select/Select";
import { Select } from "@/components/forms/Select/Select";
import { useCitySearch } from "@/hooks/useCitySearch";

import type { MusicalProduct } from "@/api/types";
import { useSchedule } from "@/hooks/useMusicalProducts";

import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { useCheckAvailabilityState } from "@/components/BandProfile/Proposals/hooks/useCheckAvailabilityState";
import { useCheckAvailabilityForm } from "@/components/BandProfile/Proposals/hooks/useCheckAvailabilityForm";
import { useCheckAvailabilitySubmit } from "@/components/BandProfile/Proposals/hooks/useCheckAvailabilitySubmit";
import { useStartConversation } from "@/hooks/useMessaging";
import { Controller } from "react-hook-form";
import { format } from "date-fns";
import { quickTimeOptions, timeToSeconds } from "@/utils";
import { DateInput } from "@/components/forms/DateInput/DateInput";

export interface CheckAvailabilityModalProps {
	isOpen: boolean;
	onClose: (value: boolean) => void;
	musicalProduct: MusicalProduct | null;
	contratanteId: number;
	produtoMusicalContratanteId: number | null;
}

export const CheckAvailabilityModal = ({
	isOpen,
	onClose,
	musicalProduct,
	contratanteId,
	produtoMusicalContratanteId,
}: CheckAvailabilityModalProps) => {
	const {
		eventTypes,
		currentMonth,
		setCurrentMonth,
		selectedDate,
		setSelectedDate,
		hasDefineEventTime,
		setHasDefineEventTime,
	} = useCheckAvailabilityState();

	const {
		setQuickDuration,
		handleHasDefineEventTime,
		form: {
			reset,
			watch,
			control,
			setValue,
			handleSubmit,
			formState: { errors },
		},
	} = useCheckAvailabilityForm({ setHasDefineEventTime });

	const duration = watch("duracao") || "";

	const {
		options: cityOptions,
		search: citySearch,
		setSearch: setCitySearch,
		loadMore: loadMoreCities,
		isFetching: isFetchingCities,
	} = useCitySearch(isOpen);

	const tipoEventoOptions: Array<Option> = (eventTypes || []).map((tipo) => ({
		value: tipo.Id.toString(),
		label: tipo.Nome,
	}));

	// The modal stays mounted while closed; only load the schedule when it opens
	// (opening requires login, so visitors never call the protected endpoint)
	const { data: agendaData } = useSchedule(
		musicalProduct?.id ?? 0,
		currentMonth,
		isOpen
	);
	// const { activeProduct } = useMusicalProductStore();
	const { isPending } = useStartConversation();

	const handleClose = () => {
		onClose(false);
		reset();
		setSelectedDate(null);
	};

	const { onSubmit } = useCheckAvailabilitySubmit({
		contratanteId,
		produtoMusicalContratanteId,
		musicalProduct,
		tipoEventoOptions,
		hasDefineEventTime,
		handleClose,
	});

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-[705px] max-h-[85vh] overflow-auto">
				<div className="px-6 py-5 border-b border-gray-200">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold text-gray-900">
							Verificar disponibilidade
						</DialogTitle>

						<DialogDescription />
					</DialogHeader>
				</div>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="px-4 pb-5 space-y-6 max-h-[calc(100vh-200px)]">
						<div>
							<Label
								htmlFor="date"
								className="text-sm font-normal text-gray-500 block"
							>
								Selecione a data <span className="text-red-500">*</span>
							</Label>

							<DatePicker
								mode="check-availability"
								currentMonth={currentMonth}
								setCurrentMonth={setCurrentMonth}
								onSelectDate={(date) => {
									setSelectedDate(date);

									if (date) {
										setValue("dataEvento", format(date, "yyyy-MM-dd"));
									}
								}}
								events={agendaData}
							/>
						</div>

						<>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Controller
										control={control}
										name="dataEvento"
										render={({ field }) => (
											<>
												{/* Phones: the calendar above already picks the date and
												    this field doubled it; the error still shows */}
												<div className="hidden sm:block space-y-2">
													<Label htmlFor="dataEvento">Data</Label>
													<DateInput
														id="dataEvento"
														value={field.value}
														onChange={field.onChange}
														onBlur={field.onBlur}
													/>
												</div>

												{errors.dataEvento?.message && (
													<div className="text-red-500 text-sm">
														{errors.dataEvento.message}
													</div>
												)}
											</>
										)}
									/>
								</div>
							</div>

							{/* Event Type */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Controller
										control={control}
										name="idTipoEvento"
										render={({ field }) => (
											<>
												<Select
													label="Tipo de Evento"
													name="eventType"
													options={tipoEventoOptions}
													placeholder="Selecionar tipo"
													selectedOptions={tipoEventoOptions.filter(
														(option) => option.value === String(field.value)
													)}
													setSelectedOptions={(options) => {
														field.onChange(Number(options[0]?.value ?? 0));
													}}
												/>

												{errors.idTipoEvento?.message && (
													<div className="text-red-500 text-sm">
														{errors.idTipoEvento.message}
													</div>
												)}
											</>
										)}
									/>
								</div>

								{/* Location */}
								<div className="space-y-2">
									<Controller
										control={control}
										name="local"
										render={({ field }) => (
											<>
												{/* The cities in the database, searchable as you type;
												    `local` keeps the city name ("São Paulo - SP") */}
												<Select
													label="Local do Evento"
													name="local"
													options={cityOptions}
													placeholder="Selecione a cidade"
													selectedOptions={
														field.value
															? [
																	cityOptions.find(
																		(option) => option.label === field.value
																	) ?? {
																		value: field.value,
																		label: field.value,
																	},
																]
															: []
													}
													setSelectedOptions={(options) => {
														field.onChange(options[0]?.label ?? "");
													}}
													searchTerm={citySearch}
													setSearchTerm={setCitySearch}
													onReachEnd={loadMoreCities}
													isLoading={isFetchingCities}
												/>

												{errors.local?.message && (
													<div className="text-red-500 text-sm">
														{errors.local.message}
													</div>
												)}
											</>
										)}
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4">
								<div>
									<Label className="text-sm font-medium text-gray-700 mb-2 block">
										Horário
									</Label>

									<div className="grid grid-cols-1 md:grid-cols-1 gap-4">
										<div className="flex items-center gap-3">
											<Checkbox
												id="hasDefineEventTime"
												checked={hasDefineEventTime}
												onCheckedChange={(checked) => {
													handleHasDefineEventTime(Boolean(checked));
												}}
											/>
											<Label
												htmlFor="availabilityOtherEvents"
												className="text-sm font-medium text-gray-700 cursor-pointer"
											>
												Definir horário do inicio do show
											</Label>
										</div>
									</div>
								</div>
							</div>

							{/* Time fields */}
							<div>
								{hasDefineEventTime && (
									<div className="grid grid-cols-2 gap-4 mb-4">
										<div className="space-y-2">
											<Controller
												control={control}
												name="horaInicio"
												render={({ field }) => (
													<>
														<Label htmlFor="horaInicio">Hora de Início</Label>
														<Input
															id="horaInicio"
															type="time"
															{...field}
															placeholder="--:--"
															onChange={(event) => {
																const startTime = event.target.value;

																field.onChange(startTime);
															}}
														/>

														{errors.horaInicio?.message && (
															<div className="text-red-500 text-sm">
																{errors.horaInicio.message}
															</div>
														)}
													</>
												)}
											/>
										</div>
									</div>
								)}

								{/* Quick duration buttons */}
								{hasDefineEventTime && (
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-sm text-gray-600">Duração:</span>
										{quickTimeOptions.map((option) => (
											<button
												key={option.duration}
												type="button"
												onClick={() => {
													setQuickDuration(option.duration);
												}}
												className={`px-3 py-1.5 text-sm  border border-gray-200
													rounded-md transition-colors
												${
													duration &&
													timeToSeconds(duration) === option.duration
														? "bg-primary-500 text-white"
														: "bg-white hover:bg-primary-50 hover:border-primary-300"
												}
													`}
											>
												{option.label}
											</button>
										))}
									</div>
								)}
							</div>

							{/* Footer */}
							<div className="flex pb-4 max-xs:flex-col justify-center gap-2">
								<Button
									type="button"
									variant="secondary"
									onClick={() => {
										handleClose();
									}}
									className="px-4 py-2 w-full max-w-[400px]:w-[50%] md:w-[30%]"
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									variant="primary"
									disabled={selectedDate === null || isPending}
									className="px-4 py-2 w-full max-w-[400px]:w-[50%] md:w-[30%]"
								>
									{isPending ? "Carregando..." : "Verificar"}
								</Button>
							</div>
						</>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};

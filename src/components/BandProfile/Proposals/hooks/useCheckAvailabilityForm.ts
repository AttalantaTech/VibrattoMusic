import { zodResolver } from "@hookform/resolvers/zod";
import type { CheckAvailabilityForm } from "../schemas/checkAvailability.schema";
import { checkAvailabilityValidationSchema } from "../schemas/checkAvailability.schema";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useEffect, useMemo } from "react";
import { secondsToTime, toBR } from "@/utils";

export const useCheckAvailabilityForm = () => {
	const initialValues: CheckAvailabilityForm =
		useMemo<CheckAvailabilityForm>(() => {
			return {
				idTipoEvento: 0,
				local: "",
				descricao: "",
				dataEvento: format(toBR(new Date()), "yyyy-MM-dd"),
				// Optional; the duration is required and has no preset
				horaInicio: "",
				duracao: "",
			};
		}, []);

	const form = useForm<CheckAvailabilityForm>({
		resolver: zodResolver(checkAvailabilityValidationSchema),
		defaultValues: initialValues,
	});

	const setQuickDuration = (durationSeconds: number) => {
		form.setValue("duracao", secondsToTime(durationSeconds), {
			shouldValidate: true,
		});
	};

	useEffect(() => {
		form.reset(initialValues);
	}, [initialValues, form]);

	return {
		form,
		setQuickDuration,
	};
};

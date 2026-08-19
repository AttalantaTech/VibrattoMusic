import { zodResolver } from "@hookform/resolvers/zod";
import type { CheckAvailabilityForm } from "../schemas/checkAvailability.schema";
import { checkAvailabilityValidationSchema } from "../schemas/checkAvailability.schema";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useEffect, useMemo } from "react";
import { secondsToTime, toBR } from "@/utils";

interface CheckAvailabilityFormProps {
	setHasDefineEventTime: (value: boolean) => void;
}

export const useCheckAvailabilityForm = ({
	setHasDefineEventTime,
}: CheckAvailabilityFormProps) => {
	const initialValues: CheckAvailabilityForm =
		useMemo<CheckAvailabilityForm>(() => {
			return {
				idTipoEvento: 0,
				local: "",
				descricao: "",
				dataEvento: format(toBR(new Date()), "yyyy-MM-dd"),
				horaInicio: "",
				duracao: "",
			};
		}, []);

	const form = useForm<CheckAvailabilityForm>({
		resolver: zodResolver(checkAvailabilityValidationSchema),
		defaultValues: initialValues,
	});

	const setQuickDuration = (durationSeconds: number) => {
		const startTime = form.getValues("horaInicio");

		if (!startTime) return;

		const duration = secondsToTime(durationSeconds);

		form.setValue("duracao", duration);
	};

	const handleHasDefineEventTime = (state: boolean) => {
		setHasDefineEventTime(state);

		const currentStartTime = form.getValues("horaInicio");

		if (!state) {
			form.setValue("horaInicio", "");

			return;
		}

		const hourPtBR = new Date().toLocaleString("pt-BR", {
			timeZone: "America/Sao_Paulo",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

		const startTime = currentStartTime || hourPtBR;

		form.setValue("horaInicio", startTime);
		form.setValue("duracao", "02:00:00");
	};

	useEffect(() => {
		form.reset(initialValues);
	}, [initialValues, form]);

	return {
		form,
		handleHasDefineEventTime,
		setQuickDuration,
	};
};

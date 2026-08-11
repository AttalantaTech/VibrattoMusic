import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { createProposalSchema } from "../schemas/proposal.schema";

import { addDays, format, parseISO } from "date-fns";
import type { ProposalResponse } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import type { ProposalFormData } from "../types";

interface ProposalFormProps {
	proposal?: ProposalResponse | null;
	contractorId?: number;
	contractorName?: string;
	setHasDefineEventTime: (value: boolean) => void;
}

export const useProposalForm = ({
	proposal,
	contractorId,
	contractorName,
	setHasDefineEventTime,
}: ProposalFormProps) => {
	const { user } = useAuthStore();

	// Helper function to get contractor ID
	const getContractorId = useCallback(() => {
		// First try the prop and user.id
		if (contractorId) return contractorId;
		if (user?.id) return user.id;

		// Fallback to extracting from token
		try {
			const { token } = useAuthStore.getState();
			if (!token) return 0;

			const tokenParts = token.split(".");
			if (tokenParts.length !== 3) return 0;

			const payloadString = tokenParts[1];
			if (!payloadString) return 0;

			const payload = JSON.parse(atob(payloadString)) as {
				sub?: string;
				userId?: string | number;
				nameid?: string;
				unique_name?: string;
			};

			// Try different common JWT fields for user ID
			const possibleIds = [
				payload.sub,
				payload.userId,
				payload.nameid,
				payload.unique_name,
			];

			for (const id of possibleIds) {
				if (id) {
					const numericId = Number(id);
					if (!isNaN(numericId) && numericId > 0) {
						return numericId;
					}
				}
			}
		} catch (error) {
			console.warn("⚠️ Could not extract user ID from token:", error);
		}

		return 0;
	}, [contractorId, user]);

	const initialValues = useMemo<ProposalFormData>(() => {
		return {
			idContratante: proposal?.idContratante || getContractorId(),
			nomeContratante: proposal?.contratante.nome || contractorName || "",
			idTipoEvento: proposal?.tipoEvento.id || 0,
			descricao: proposal?.descricao || "",
			valor: proposal?.valor || 0,
			local: proposal?.local || "",
			dataInicio: proposal?.dataInicio
				? format(proposal.dataInicio, "yyyy-MM-dd")
				: format(new Date(), "yyyy-MM-dd"),
			dataFim: proposal?.dataFim
				? format(String(proposal.dataFim), "yyyy-MM-dd")
				: "",
			horaInicio: proposal?.horaInicio || "",
			horaFim: proposal?.horaFim || "",
			transporteIncluso: proposal?.transporteIncluso || false,
			acomodacaoInclusa: proposal?.acomodacaoInclusa || false,
			formaPagamento: proposal?.formaPagamento.map((item) => item.id) || [],
			idCondicoesPagamento: proposal?.condicoesPagamento.id || 2,
		};
	}, [proposal, contractorName, getContractorId]);

	const form = useForm<ProposalFormData>({
		resolver: zodResolver(createProposalSchema),
		defaultValues: initialValues,
	});

	const timeToMinutes = (time: string) => {
		const [hours = 0, minutes = 0] = time.split(":").map(Number);

		return hours * 60 + minutes;
	};

	const minutesToTime = (totalMinutes: number) => {
		const minutesInDays = 24 * 60;

		const normalizedMinutes = totalMinutes % minutesInDays;

		const hours = Math.floor(normalizedMinutes / 60);
		const minutes = normalizedMinutes % 60;

		return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
	};

	const calculateEndTime = (startTime: string, durationMinutes: number) => {
		const startMinutes = timeToMinutes(startTime);
		const endMinutes = startMinutes + durationMinutes;

		return {
			endTime: minutesToTime(endMinutes),
			isNextDay: endMinutes >= 24 * 60,
		};
	};

	const updateEndDate = (isNextDay: boolean) => {
		const startDate = form.getValues("dataInicio");

		if (!startDate) return;

		const parsedStartDate = parseISO(startDate);

		const endDate = isNextDay ? addDays(parsedStartDate, 1) : parsedStartDate;

		form.setValue("dataFim", format(endDate, "yyyy-MM-dd"));
	};

	const setQuickDuration = (durationMinutes: number) => {
		const startTime = form.getValues("horaInicio");

		if (!startTime) return;

		const { endTime, isNextDay } = calculateEndTime(startTime, durationMinutes);

		form.setValue("horaFim", endTime);

		updateEndDate(isNextDay);
	};

	const updateEndDateByTime = (startTime: string, endTime: string) => {
		const startDate = form.getValues("dataInicio");

		if (!startDate || !startTime || !endTime) {
			return;
		}

		const startMinutes = timeToMinutes(startTime);
		const endMinutes = timeToMinutes(endTime);

		const isNextDay = endMinutes < startMinutes;

		const parsedStartDate = parseISO(startDate);

		const endDate = isNextDay ? addDays(parsedStartDate, 1) : parsedStartDate;

		form.setValue("dataFim", format(endDate, "yyyy-MM-dd"));
	};

	const handleHasDefineEventTime = (state: boolean) => {
		setHasDefineEventTime(state);

		const startDate = form.getValues("dataInicio");
		const currentStartTime = form.getValues("horaInicio");
		const currentEndTime = form.getValues("horaFim");

		if (!state) {
			form.setValue("horaInicio", "");
			form.setValue("horaFim", "");

			return;
		}

		const hourPtBR = new Date().toLocaleString("pt-BR", {
			timeZone: "America/Sao_Paulo",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

		const startTime = currentStartTime || hourPtBR;
		const startMinutes = timeToMinutes(startTime);

		let endMinutes: number;
		let isNextDay: boolean;

		if (currentEndTime) {
			endMinutes = timeToMinutes(currentEndTime);

			// Checks if it is past midnight.
			isNextDay = endMinutes < startMinutes;
		} else {
			endMinutes = startMinutes + 120;

			// Checks if it is past midnight.
			isNextDay = endMinutes >= 24 * 60;
		}

		const endTime = minutesToTime(endMinutes);

		form.setValue("horaInicio", startTime);
		form.setValue("horaFim", endTime);

		if (startDate) {
			const parsedStartDate = parseISO(startDate);

			const endDate = isNextDay ? addDays(parsedStartDate, 1) : parsedStartDate;
			form.setValue("dataFim", format(endDate, "yyyy-MM-dd"));
		}
	};

	const isSectionComplete = (
		section:
			| "eventData"
			| "paymentConditions"
			| "includedServices"
			| "digitalContract"
	): boolean => {
		const idTipoEvento = form.watch("idTipoEvento");
		const valor = form.watch("valor");
		const formaPagamento = form.watch("formaPagamento");
		const idCondicoesPagamento = form.watch("idCondicoesPagamento");

		switch (section) {
			case "eventData":
				return !!(
					idTipoEvento &&
					idTipoEvento > 0 &&
					form.watch("nomeContratante") &&
					form.watch("descricao") &&
					form.watch("local") &&
					form.watch("dataInicio") &&
					form.watch("dataFim") &&
					form.watch("horaInicio") &&
					form.watch("horaFim")
				);
			case "paymentConditions":
				return !!(
					valor &&
					Number(valor) > 0 &&
					formaPagamento &&
					formaPagamento?.length > 0 &&
					idCondicoesPagamento &&
					idCondicoesPagamento > 0
				);
			case "includedServices":
				return true; // Optional section
			case "digitalContract":
				return true; // Always complete
			default:
				return false;
		}
	};

	useEffect(() => {
		form.reset(initialValues);
	}, [initialValues, form]);

	return {
		form,
		initialValues,
		setQuickDuration,
		isSectionComplete,
		handleHasDefineEventTime,
		updateEndDateByTime,
	};
};

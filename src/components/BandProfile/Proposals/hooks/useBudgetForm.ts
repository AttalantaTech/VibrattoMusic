import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { CreateProposalForm } from "../schemas/proposal.schema";
import { createProposalSchema } from "../schemas/proposal.schema";

import { format } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { secondsToTime, toBR } from "@/utils";

interface BudgetFormProps {
	budget?: CreateProposalForm | null;
	contractorId?: number;
	contractorName?: string;
	setHasDefineEventTime: (value: boolean) => void;
}

export const useBudgetForm = ({
	budget,
	contractorId,
	contractorName,
	setHasDefineEventTime,
}: BudgetFormProps) => {
	const { user } = useAuthStore();

	console.log(budget);

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

	const dataEvento = useMemo(
		() =>
			budget?.dataEvento
				? format(budget.dataEvento, "yyyy-MM-dd")
				: format(toBR(new Date()), "yyyy-MM-dd"),
		[budget?.dataEvento]
	);

	const initialValues: CreateProposalForm = useMemo<CreateProposalForm>(() => {
		return {
			idContratante: getContractorId(),
			nomeContratante: budget?.nomeContratante || contractorName || "",
			idTipoEvento: budget?.idTipoEvento || 0,
			descricao: budget?.descricao || "",
			valor: 0,
			local: budget?.local || "",
			dataEvento,
			dataVencimentoAceite: 15,
			dataVencimentoSinalPagamento: 30,
			horaInicio: budget?.horaInicio || "",
			duracao: budget?.duracao || "",
			transporteIncluso: false,
			acomodacaoInclusa: false,
			formaPagamento: [],
			idCondicoesPagamento: 2,
			idOrcamento: budget?.idOrcamento || null,
		};
	}, [budget, contractorName, getContractorId, dataEvento]);

	const form = useForm<CreateProposalForm>({
		resolver: zodResolver(createProposalSchema),
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
					form.watch("dataEvento") &&
					form.watch("horaInicio") &&
					form.watch("duracao")
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
	};
};

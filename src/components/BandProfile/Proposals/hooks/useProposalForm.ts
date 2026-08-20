import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { CreateProposalForm } from "../schemas/proposal.schema";
import { createProposalSchema } from "../schemas/proposal.schema";

import { differenceInDays, format } from "date-fns";
import type { ProposalResponse } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import { calculateDuration, secondsToTime, toBR } from "@/utils";

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

	const dataEvento = useMemo(
		() =>
			proposal?.dataInicio
				? format(proposal.dataInicio, "yyyy-MM-dd")
				: format(toBR(new Date()), "yyyy-MM-dd"),
		[proposal?.dataInicio]
	);

	const dataVencimentoAceite = useMemo(
		() =>
			proposal?.dataVencimentoAceite
				? differenceInDays(proposal.dataVencimentoAceite, dataEvento)
				: 15,
		[dataEvento, proposal?.dataVencimentoAceite]
	);

	const dataVencimentoSinalPagamento = useMemo(
		() =>
			proposal?.dataVencimentoSinalPagamento
				? differenceInDays(proposal.dataVencimentoSinalPagamento, dataEvento)
				: 30,
		[dataEvento, proposal?.dataVencimentoSinalPagamento]
	);

	const duration = useMemo(
		() =>
			proposal?.horaInicio && proposal.horaFim
				? calculateDuration(proposal.horaInicio, proposal.horaFim)
						.durationFormatted
				: "",
		[proposal]
	);

	const initialValues: CreateProposalForm = useMemo<CreateProposalForm>(() => {
		return {
			idContratante: proposal?.idContratante || getContractorId(),
			nomeContratante: proposal?.contratante.nome || contractorName || "",
			idTipoEvento: proposal?.tipoEvento.id || 0,
			descricao: proposal?.descricao || "",
			valor: proposal?.valor || 0,
			local: proposal?.local || "",
			dataEvento,
			dataVencimentoAceite,
			dataVencimentoSinalPagamento,
			horaInicio: proposal?.horaInicio || "",
			duracao: duration || "",
			formaPagamento: proposal?.formaPagamento.map((item) => item.id) || [],
			idCondicoesPagamento: proposal?.condicoesPagamento.id || 2,
			transporteIncluso: proposal?.transporteIncluso || false,
			acomodacaoInclusa: proposal?.acomodacaoInclusa || false,
			camarimIncluso: proposal?.acomodacaoInclusa || false,
			estruturaPalcoSomIluminacaoInclusa: proposal?.acomodacaoInclusa || false,
			// geradorIncluso: proposal?.geradorIncluso || false
		};
	}, [
		proposal,
		contractorName,
		getContractorId,
		dataEvento,
		dataVencimentoAceite,
		dataVencimentoSinalPagamento,
		duration,
	]);

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

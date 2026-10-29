import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { CreateProposalForm } from "../schemas/proposal.schema";
import { createProposalSchema } from "../schemas/proposal.schema";

import { format } from "date-fns";
import type { ProposalResponse } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import { calculateDuration, secondsToTime, toBR } from "@/utils";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { useUser } from "@/hooks/useUser";
import {
	descriptionComplement,
	handleStandardProposalDescription,
	proposalLegalParty,
} from "../utils/handleStandardProposalDescription";
import { deadlineDays } from "../utils/deadlines";

interface ProposalFormProps {
	proposal?: ProposalResponse | null;
	counterProposalOf?: ProposalResponse | null;
	contractorId?: number;
	contractorName?: string;
	setHasDefineEventTime: (value: boolean) => void;
}

export const useProposalForm = ({
	proposal: editedProposal,
	counterProposalOf,
	contractorId,
	contractorName,
	setHasDefineEventTime,
}: ProposalFormProps) => {
	// A counter-proposal starts from every field of the rejected proposal
	const proposal = editedProposal ?? counterProposalOf ?? null;

	const { user } = useAuthStore();
	const { data: userData } = useUser();
	const { activeProduct } = useMusicalProductStore();

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

	// Saved deadlines go back into the form as days from today
	const dataVencimentoAceite = useMemo(
		// A counter-proposal gets fresh deadlines: the old ones count from the
		// day the rejected proposal was sent
		() => deadlineDays(editedProposal?.dataVencimentoAceite, 15),
		[editedProposal?.dataVencimentoAceite]
	);

	const dataVencimentoSinalPagamento = useMemo(
		() => deadlineDays(editedProposal?.dataVencimentoSinalPagamento, 30),
		[editedProposal?.dataVencimentoSinalPagamento]
	);

	const duration = useMemo(
		() =>
			proposal?.horaInicio && proposal.horaFim
				? calculateDuration(proposal.horaInicio, proposal.horaFim)
						.durationFormatted
				: "",
		[proposal]
	);

	// Shown fixed above the description field and sent in the chat card; the
	// PDF prints its own copy, so it isn't saved in descricao
	const standardDescription = useMemo(() => {
		if (!activeProduct) return "";

		return handleStandardProposalDescription({
			category: String(activeProduct.categoria.nome),
			...proposalLegalParty({ product: activeProduct, user: userData }),
			artisticName: activeProduct.nome,
		});
	}, [activeProduct, userData]);

	const initialValues: CreateProposalForm = useMemo<CreateProposalForm>(() => {
		return {
			idContratante: proposal?.idContratante || getContractorId(),
			// Standalone proposals keep the typed name in nomeContratante
			nomeContratante:
				proposal?.contratante.nome ||
				proposal?.nomeContratante ||
				contractorName ||
				"",
			idTipoEvento: proposal?.tipoEvento.id || 0,
			tipoSinalPagamento: proposal?.tipoSinalPagamento || null,
			// Only an amount in reais fills the custom field
			valorSinalPagamento:
				proposal?.tipoSinalPagamento === "V"
					? proposal.valorSinalPagamento || 0
					: 0,
			// Only the complement is editable (older proposals saved the
			// standard text here too)
			descricao: descriptionComplement(proposal?.descricao),
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
			camarimIncluso: proposal?.camarimIncluso || false,
			estruturaPalcoSomIluminacaoInclusa:
				proposal?.estruturaPalcoSomIluminacaoInclusa || false,
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
		standardDescription,
		setQuickDuration,
		isSectionComplete,
		handleHasDefineEventTime,
	};
};

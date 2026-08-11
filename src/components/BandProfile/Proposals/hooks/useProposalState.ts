import { filterService } from "@/api";
import type { FilterOption, ProposalResponse } from "@/api/types";
import type { Option } from "@/components/forms/Select/Select";
import { useEffect, useState } from "react";

export const useProposalState = (proposal: ProposalResponse | null) => {
	const [hasDefineEventTime, setHasDefineEventTime] = useState(false);
	const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<
		Array<Option>
	>([]);
	const [eventTypes, setEventTypes] = useState<Array<FilterOption>>([]);
	const [paymentMethods, setPaymentMethods] = useState<Array<FilterOption>>([]);
	const [paymentConditions, setPaymentConditions] = useState<
		Array<FilterOption>
	>([]);
	const [showProfileIncompleteModal, setShowProfileIncompleteModal] =
		useState(false);

	// Accordion sections state
	const [expandedSections, setExpandedSections] = useState({
		eventData: true,
		paymentConditions: false,
		includedServices: false,
		digitalContract: false,
	});

	// Load event types and payment options on mount
	useEffect(() => {
		const loadOptions = async () => {
			try {
				const [types, formas, condicoes] = await Promise.all([
					filterService.getTiposEvento(),
					filterService.getFormasPagamento(),
					filterService.getCondicoesPagamento(),
				]);
				setEventTypes(types);
				setPaymentMethods(formas);
				setPaymentConditions(condicoes);

				// Initialize genres
				if (proposal?.formaPagamento?.length) {
					const paymentOptions = proposal.formaPagamento
						.map((paymentOption: { id: number; nome: string }) =>
							formas.find((payment) => payment.Id === paymentOption.id)
						)
						.filter((genero): genero is FilterOption => genero !== undefined)
						.map((genero) => ({
							value: genero.Id.toString(),
							label: genero.Nome,
						}));
					setSelectedPaymentMethods(paymentOptions);
				}
			} catch (error) {
				console.error("Error loading event types:", error);
			}
		};
		void loadOptions();
	}, [
		proposal?.formaPagamento,
		setEventTypes,
		setPaymentConditions,
		setPaymentMethods,
	]);

	useEffect(() => {
		if (proposal?.horaFim) {
			setHasDefineEventTime(true);
		}
	}, [proposal?.horaFim]);

	return {
		hasDefineEventTime,
		setHasDefineEventTime,
		eventTypes,
		paymentMethods,
		paymentConditions,
		showProfileIncompleteModal,
		setShowProfileIncompleteModal,
		expandedSections,
		setExpandedSections,
		selectedPaymentMethods,
		setSelectedPaymentMethods,
	};
};

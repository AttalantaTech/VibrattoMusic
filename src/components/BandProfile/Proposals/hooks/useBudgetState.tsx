import { filterService } from "@/api";
import type { FilterOption } from "@/api/types";
import type { Option } from "@/components/forms/Select/Select";
import { useEffect, useState } from "react";

export const useBudgetState = () => {
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
			} catch (error) {
				console.error("Error loading event types:", error);
			}
		};
		void loadOptions();
	}, [setEventTypes, setPaymentConditions, setPaymentMethods]);

	return {
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

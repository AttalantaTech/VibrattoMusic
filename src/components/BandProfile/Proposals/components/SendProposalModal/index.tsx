import {
	DollarSignIcon,
	CalendarIcon,
	FileTextIcon,
	CheckCircleIcon,
} from "lucide-react";
import { Button } from "../../../../ui/Button/Button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../../ui/dialog";
import { Input } from "../../../../ui/Input/Input";
import { Label } from "../../../../ui/Label/Label";
import { Textarea } from "../../../../ui/Textarea/Textarea";
import { Switch } from "../../../../ui/switch";
import { SingleSelect } from "../../../../forms/SingleSelect/SingleSelect";
import { useCreateProposal } from "../../../../../hooks/useProposals";
import type { ProposalResponse } from "../../../../../api/types";

import { ProfileIncompleteModal } from "../../../../ui/ProfileIncompleteModal/ProfileIncompleteModal";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";

import { Accordion } from "@/components/ui/Accordion";
import { useProposalForm } from "../../hooks/useProposalForm";
import { useProposalSubmit } from "../../hooks/useProposalSubmit";
import { Controller } from "react-hook-form";
import { useProposalState } from "../../hooks/useProposalState";
import { handleCurrencyFormatting } from "@/utils";
import { Select } from "@/components/forms/Select/Select";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";

interface SendProposalModalProps {
	isOpen: boolean;
	onClose: () => void;
	recipientId?: number; // Proposal recipient ID (optional for context)
	contractorId?: number;
	contractorName?: string;
	conversationId?: number; // Conversation ID for sending a message
	onProposalSent?: (proposalDetails: string) => Promise<void>; // Callback to send a message after the proposal
	proposal?: ProposalResponse | null;
}

// Quick time options
const quickTimeOptions = [
	{ label: "30 min", duration: 30 },
	{ label: "1h", duration: 60 },
	{ label: "1h30", duration: 90 },
	{ label: "2h", duration: 120 },
	{ label: "2h30", duration: 150 },
	{ label: "3h", duration: 180 },
	{ label: "3h30", duration: 210 },
	{ label: "4h", duration: 240 },
	{ label: "4h30", duration: 270 },
	{ label: "5h", duration: 300 },
];

export const SendProposalModal = ({
	isOpen,
	onClose,
	contractorId,
	contractorName,
	conversationId,
	onProposalSent,
	proposal,
}: SendProposalModalProps) => {
	// Use the currently active musical product
	const { activeProduct } = useMusicalProductStore();
	const userProductId = activeProduct?.id
		? Number(activeProduct.id)
		: undefined;

	const createProposalMutation = useCreateProposal();

	const {
		eventTypes,
		paymentMethods,
		paymentConditions,
		showProfileIncompleteModal,
		setShowProfileIncompleteModal,
		expandedSections,
		setExpandedSections,
		selectedPaymentMethods,
		setSelectedPaymentMethods,
		hasDefineEventTime,
		setHasDefineEventTime,
	} = useProposalState(proposal || null);

	const {
		form,
		setQuickDuration,
		handleHasDefineEventTime,
		isSectionComplete,
		updateEndDateByTime,
	} = useProposalForm({
		proposal,
		contractorId,
		contractorName,
		setHasDefineEventTime,
	});
	const {
		handleSubmit,
		control,
		formState: { errors },
	} = form;

	const handleClose = () => {
		onClose();
		setHasDefineEventTime(false);
		setSelectedPaymentMethods([]);
	};

	const { onSubmit } = useProposalSubmit({
		eventTypes,
		handleClose,
		paymentConditions,
		paymentMethods,
		proposal,
		setShowProfileIncompleteModal,
		contractorId,
		conversationId,
		onProposalSent,
		userProductId,
		hasDefineEventTime,
	});

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((previous) => ({
			...previous,
			[section]: !previous[section],
		}));
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose();
			}}
		>
			<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
				<form onSubmit={handleSubmit(onSubmit)}>
					<DialogHeader>
						<DialogTitle>
							{proposal ? "Editar Proposta" : "Criar Nova Proposta"}
						</DialogTitle>
						<DialogDescription>
							{proposal
								? "Edite com facilidade os campos da proposta"
								: "Configure todos os campos necessários para criar a proposta"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Event Data Section */}
						<Accordion
							title="Dados do Evento"
							description="Informações básicas sobre o evento"
							icon={<CalendarIcon className="h-5 w-5 text-gray-600" />}
							isExpanded={expandedSections.eventData}
							isComplete={isSectionComplete("eventData")}
							onToggle={() => {
								toggleSection("eventData");
							}}
						>
							{/* Event Type */}
							<div className="space-y-2">
								<Controller
									control={control}
									name="idTipoEvento"
									render={({ field }) => (
										<>
											<Label htmlFor="eventType">Tipo de Evento</Label>
											<SingleSelect
												value={
													field.value && field.value > 0
														? String(field.value)
														: ""
												}
												onChange={(value) => {
													const numericValue = value ? Number(value) : 0;
													field.onChange(numericValue);
												}}
												options={eventTypes.map((type) => ({
													value: String(type.Id),
													label: type.Nome,
												}))}
												placeholder="Selecionar tipo"
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

							{/* Contractor Name */}
							<div className="space-y-2">
								<Controller
									control={control}
									name="nomeContratante"
									render={({ field }) => (
										<>
											<Label htmlFor="nomeContratante">
												Nome do Contratante *
											</Label>
											<Input
												id="nomeContratante"
												{...field}
												placeholder="Digite o nome completo do contratante"
											/>

											{errors.nomeContratante?.message && (
												<div className="text-red-500 text-sm">
													{errors.nomeContratante.message}
												</div>
											)}
										</>
									)}
								/>
							</div>

							{/* Description */}
							<div className="space-y-2">
								<Controller
									control={control}
									name="descricao"
									render={({ field }) => (
										<>
											<Label htmlFor="description">Descrição da Proposta</Label>
											<Textarea
												id="description"
												{...field}
												placeholder="Descreva detalhes da apresentação, repertório, equipamentos..."
												rows={3}
											/>
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
											<Label htmlFor="location">Local do Evento</Label>
											<Input
												id="location"
												{...field}
												placeholder="Endereço completo do evento"
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

							{/* Date fields */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Controller
										control={control}
										name="dataInicio"
										render={({ field }) => (
											<>
												<Label htmlFor="startDate">Data</Label>
												<Input
													id="startDate"
													type="date"
													{...field}
													placeholder="dd/mm/aaaa"
												/>

												{errors.dataInicio?.message && (
													<div className="text-red-500 text-sm">
														{errors.dataInicio.message}
													</div>
												)}
											</>
										)}
									/>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<Checkbox
									id="hasDefineEventTime"
									checked={hasDefineEventTime}
									onCheckedChange={(checked) => {
										form.setValue("definirHorarioEvento", Boolean(checked));
										handleHasDefineEventTime(Boolean(checked));
									}}
								/>
								<Label
									htmlFor="availabilityOtherEvents"
									className="text-sm font-medium text-gray-700 cursor-pointer"
								>
									Definir horário do Evento
								</Label>
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
														<Label htmlFor="startTime">Hora de Início</Label>
														<Input
															id="startTime"
															type="time"
															{...field}
															placeholder="--:--"
															onChange={(event) => {
																const startTime = event.target.value;
																const endTime = form.getValues("horaFim");

																field.onChange(startTime);

																if (endTime) {
																	updateEndDateByTime(startTime, endTime);
																}
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

										<div className="space-y-2">
											<Controller
												control={control}
												name="horaFim"
												render={({ field }) => (
													<>
														<Label htmlFor="endTime">Hora de Fim</Label>
														<Input
															id="endTime"
															type="time"
															{...field}
															placeholder="--:--"
															onChange={(event) => {
																const startTime = form.getValues("horaInicio");
																const endTime = event.target.value;

																field.onChange(endTime);

																if (startTime) {
																	updateEndDateByTime(startTime, endTime);
																}
															}}
														/>

														{errors.horaFim?.message && (
															<div className="text-red-500 text-sm">
																{errors.horaFim.message}
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
												className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors"
											>
												{option.label}
											</button>
										))}
									</div>
								)}
							</div>
						</Accordion>

						{/* Payment Conditions Section */}
						<Accordion
							title="Informações do Pagamento"
							description="Configure valor, métodos e condições de pagamento"
							icon={<DollarSignIcon className="h-5 w-5 text-gray-600" />}
							isExpanded={expandedSections.paymentConditions}
							isComplete={isSectionComplete("paymentConditions")}
							onToggle={() => {
								toggleSection("paymentConditions");
							}}
						>
							{/* Presentation Value */}
							<div className="space-y-2">
								<Controller
									control={control}
									name="valor"
									render={({ field }) => (
										<>
											<Label htmlFor="value">Valor da Apresentação</Label>
											<div className="relative">
												<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500">
													R$
												</span>
												<Input
													{...field}
													type="text"
													inputMode="numeric"
													className="pl-10"
													value={
														field.value
															? handleCurrencyFormatting(field.value)
															: ""
													}
													onChange={(event) => {
														const digits = event.target.value.replace(
															/\D/g,
															""
														);
														const number = digits ? Number(digits) / 100 : 0;

														field.onChange(number);
													}}
													placeholder="0,00"
												/>
											</div>

											{errors.valor?.message && (
												<div className="text-red-500 text-sm">
													{errors.valor.message}
												</div>
											)}
										</>
									)}
								/>
							</div>

							{/* Payment Method */}
							<div className="space-y-2">
								<Controller
									control={control}
									name="formaPagamento"
									render={({ field }) => (
										<>
											<Select
												label="Forma de Pagamento"
												name="formaPagamento"
												multiple
												options={paymentMethods.map((m) => ({
													value: String(m.Id),
													label: m.Nome,
												}))}
												selectedOptions={selectedPaymentMethods}
												setSelectedOptions={(options) => {
													setSelectedPaymentMethods(options);
													const values = (options || []).map((opt) =>
														Number(opt.value)
													);

													field.onChange(values);
												}}
											/>

											{errors.formaPagamento?.message && (
												<div className="text-red-500 text-sm">
													{errors.formaPagamento.message}
												</div>
											)}
										</>
									)}
								/>
							</div>

							{/* Payment Conditions */}
							<div className="space-y-2">
								<Controller
									control={control}
									name="idCondicoesPagamento"
									render={({ field }) => (
										<>
											<Label htmlFor="paymentConditions">
												Condições de Pagamento
											</Label>
											<SingleSelect
												value={
													field.value && field.value > 0
														? String(field.value)
														: ""
												}
												onChange={(value) => {
													const numericValue = value ? Number(value) : 0;
													field.onChange(numericValue);
												}}
												options={paymentConditions.map((c) => ({
													value: String(c.Id),
													label: c.Nome,
												}))}
												placeholder="Selecionar condição"
											/>

											{errors.idCondicoesPagamento?.message && (
												<div className="text-red-500 text-sm">
													{errors.idCondicoesPagamento.message}
												</div>
											)}
										</>
									)}
								/>
							</div>
						</Accordion>

						{/* Included Services Section */}
						<Accordion
							title="Serviços Inclusos"
							description="Defina quais serviços estão inclusos na proposta"
							icon={<CheckCircleIcon className="h-5 w-5 text-gray-600" />}
							isExpanded={expandedSections.includedServices}
							isComplete={isSectionComplete("includedServices")}
							onToggle={() => {
								toggleSection("includedServices");
							}}
						>
							{/* Changing Room Included */}
							<div className="flex items-center justify-between">
								<Controller
									control={control}
									name="acomodacaoInclusa"
									render={({ field }) => (
										<>
											<div>
												<Label
													htmlFor="camarimIncluso"
													className="text-base font-medium"
												>
													Camarim Incluso
												</Label>
												<p className="text-sm text-gray-500">
													Local reservado para preparação
												</p>
											</div>
											<Switch
												onBlur={field.onBlur}
												id="camarimIncluso"
												checked={field.value}
												onCheckedChange={(checked) => {
													field.onChange(checked);
												}}
											/>
										</>
									)}
								/>
							</div>

							{/* Transport Included */}
							<div className="flex items-center justify-between">
								<Controller
									control={control}
									name="transporteIncluso"
									render={({ field }) => (
										<>
											<div>
												<Label
													htmlFor="transporteIncluso"
													className="text-base font-medium"
												>
													Transporte Incluso
												</Label>
												<p className="text-sm text-gray-500">
													Deslocamento até o local do evento
												</p>
											</div>
											<Switch
												onBlur={field.onBlur}
												id="transporteIncluso"
												checked={field.value}
												onCheckedChange={(checked) => {
													field.onChange(checked);
												}}
											/>
										</>
									)}
								/>
							</div>
						</Accordion>

						{/* Digital Contract Section */}
						<Accordion
							title="Contrato Digital Incluído"
							description="Contrato padrão será automaticamente anexado à proposta"
							icon={<FileTextIcon className="h-5 w-5 text-gray-600" />}
							isExpanded={expandedSections.digitalContract}
							isComplete={isSectionComplete("digitalContract")}
							onToggle={() => {
								toggleSection("digitalContract");
							}}
						>
							<div className="bg-green-50 border border-green-200 rounded-lg p-4">
								<div className="flex items-start space-x-3">
									<FileTextIcon className="h-5 w-5 text-green-600 mt-0.5" />
									<div>
										<h4 className="font-medium text-green-900">
											Contrato Digital Incluído
										</h4>
										<p className="text-sm text-green-700 mt-1">
											Ao aceitar esta proposta, o cliente será direcionado para
											assinatura do contrato.
										</p>
									</div>
								</div>
							</div>
						</Accordion>

						{/* Required Fields Notice */}
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
							<p className="text-sm text-gray-600">
								Complete todos os campos necessários para criar a proposta
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="secondary" onClick={handleClose}>
							Cancelar
						</Button>
						<Button
							type="submit"
							disabled={createProposalMutation.isPending || !userProductId}
							className="bg-primary-600 hover:bg-primary-700"
						>
							{createProposalMutation.isPending
								? "Enviando..."
								: !userProductId
									? "Sem produto musical"
									: "Enviar Proposta"}
						</Button>
					</DialogFooter>
				</form>

				{/* Profile Incomplete Modal */}
				<ProfileIncompleteModal
					isOpen={showProfileIncompleteModal}
					onClose={() => {
						setShowProfileIncompleteModal(false);
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};

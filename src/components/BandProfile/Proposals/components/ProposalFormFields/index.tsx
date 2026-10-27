import {
	DollarSignIcon,
	CalendarIcon,
	FileTextIcon,
	CheckCircleIcon,
} from "lucide-react";
import {
	handleCurrencyFormatting,
	quickTimeOptions,
	timeToSeconds,
} from "@/utils";
import type { UseFormReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Accordion } from "@/components/ui/Accordion";
import { Input } from "@/components/ui/Input/Input";
import { Label } from "@/components/ui/Label/Label";
import { Textarea } from "@/components/ui/Textarea/Textarea";
import { Switch } from "@/components/ui/switch";
import { SingleSelect } from "@/components/forms/SingleSelect/SingleSelect";
import type { Option } from "@/components/forms/Select/Select";
import { Select } from "@/components/forms/Select/Select";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import type { CreateProposalForm } from "../../schemas/proposal.schema";
import type { FilterOption } from "@/api/types";

type SectionProposal =
	| "eventData"
	| "paymentConditions"
	| "includedServices"
	| "digitalContract";

interface ExpandedSections {
	eventData: boolean;
	paymentConditions: boolean;
	includedServices: boolean;
	digitalContract: boolean;
}

interface ProposalFormFieldsProps {
	form: UseFormReturn<CreateProposalForm>;
	setQuickDuration: (durationSeconds: number) => void;
	handleHasDefineEventTime: (state: boolean) => void;
	isSectionComplete: (section: SectionProposal) => boolean;
	toggleSection: (section: SectionProposal) => void;
	expandedSections: ExpandedSections;
	hasDefineEventTime: boolean;
	selectedPaymentMethods: Array<Option>;
	setSelectedPaymentMethods: (value: Array<Option>) => void;
	paymentMethods: Array<FilterOption>;
	paymentConditions: Array<FilterOption>;
	eventTypes: Array<FilterOption>;
}

export function ProposalFormFields({
	form,
	handleHasDefineEventTime,
	isSectionComplete,
	setQuickDuration,
	toggleSection,
	expandedSections,
	hasDefineEventTime,
	paymentMethods,
	selectedPaymentMethods,
	setSelectedPaymentMethods,
	paymentConditions,
	eventTypes,
}: ProposalFormFieldsProps) {
	const {
		control,
		setValue,
		watch,
		formState: { errors },
	} = form;

	const duration = watch("duracao") || "";

	return (
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
										field.value && field.value > 0 ? String(field.value) : ""
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
								<Label htmlFor="nomeContratante">Nome do Contratante *</Label>
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
									rows={4}
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
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Controller
							control={control}
							name="dataEvento"
							render={({ field }) => (
								<>
									<Label htmlFor="dataEvento">Data do Evento</Label>
									<Input
										id="dataEvento"
										type="date"
										{...field}
										placeholder="dd/mm/aaaa"
									/>

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

				{/* Date fields */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Controller
							control={control}
							name="dataVencimentoAceite"
							render={({ field }) => (
								<>
									<Label htmlFor="dataVencimentoAceite">
										Prazo para aceitar{" "}
										<span className="text-xs text-gray-400 font-light italic">
											( dias )
										</span>
									</Label>
									<Input
										id="dataVencimentoAceite"
										type="number"
										min={1}
										{...field}
										onChange={(event) => {
											const days = parseInt(event.target.value);
											field.onChange(days);
										}}
									/>

									{errors.dataVencimentoAceite?.message && (
										<div className="text-red-500 text-sm">
											{errors.dataVencimentoAceite.message}
										</div>
									)}
								</>
							)}
						/>
					</div>

					<div className="space-y-2">
						<Controller
							control={control}
							name="dataVencimentoSinalPagamento"
							render={({ field }) => (
								<>
									<Label htmlFor="dataVencimentoSinalPagamento">
										Prazo para Pagar Sinal{" "}
										<span className="text-xs text-gray-400 font-light italic">
											( dias )
										</span>
									</Label>
									<Input
										id="dataVencimentoSinalPagamento"
										type="number"
										min={1}
										{...field}
										onChange={(event) => {
											const days = parseInt(event.target.value);
											field.onChange(days);
										}}
									/>

									{errors.dataVencimentoSinalPagamento?.message && (
										<div className="text-red-500 text-sm">
											{errors.dataVencimentoSinalPagamento.message}
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
							setValue("definirHorarioEvento", Boolean(checked));
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
											field.value ? handleCurrencyFormatting(field.value) : ""
										}
										onChange={(event) => {
											const digits = event.target.value.replace(/\D/g, "");
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
										field.value && field.value > 0 ? String(field.value) : ""
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
				<div className="flex items-center justify-between">
					<Controller
						control={control}
						name="camarimIncluso"
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
										Local reservado para preparação da equipe antes do show
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

				<div className="flex items-center justify-between">
					<Controller
						control={control}
						name="acomodacaoInclusa"
						render={({ field }) => (
							<>
								<div>
									<Label
										htmlFor="acomodacaoInclusa"
										className="text-base font-medium"
									>
										Acomodação Inclusa
									</Label>
									<p className="text-sm text-gray-500">
										Hospedagem para acomodar a equipe antes do evento
									</p>
								</div>
								<Switch
									onBlur={field.onBlur}
									id="acomodacaoInclusa"
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked);
									}}
								/>
							</>
						)}
					/>
				</div>

				<div className="flex items-center justify-between">
					<Controller
						control={control}
						name="estruturaPalcoSomIluminacaoInclusa"
						render={({ field }) => (
							<>
								<div>
									<Label
										htmlFor="estruturaPalcoSomIluminacaoInclusa"
										className="text-base font-medium"
									>
										Estrutura de Palco Inclusa
									</Label>
									<p className="text-sm text-gray-500">
										Estrutura de som e iluminacao para realização do evento
									</p>
								</div>
								<Switch
									onBlur={field.onBlur}
									id="estruturaPalcoSomIluminacaoInclusa"
									checked={field.value}
									onCheckedChange={(checked) => {
										field.onChange(checked);
									}}
								/>
							</>
						)}
					/>
				</div>

				{/* <div className="flex items-center justify-between">
								<Controller
									control={control}
									name="geradorIncluso"
									render={({ field }) => (
										<>
											<div>
												<Label
													htmlFor="estruturaPalcoSomIluminacaoInclusa"
													className="text-base font-medium"
												>
													Gerador Incluso
												</Label>
												<p className="text-sm text-gray-500">
													Gerador de energia para garantir o funcionamento
													elétrico do evento
												</p>
											</div>
											<Switch
												onBlur={field.onBlur}
												id="geradorIncluso"
												checked={field.value}
												onCheckedChange={(checked) => {
													field.onChange(checked);
												}}
											/>
										</>
									)}
								/>
							</div> */}
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
	);
}

// Core API types for Vibratto platform

// ===== Common Types =====

export interface ApiResponse<T = unknown> {
	data?: T;
	message?: string;
	success?: boolean;
	errors?: Array<{
		propertyName: string;
		errorMessage: string;
	}>;
}

export interface PaginationParameters {
	page?: number;
	limit?: number;
	orderBy?: string;
	orderDirection?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
	data: Array<T>;
	pagination: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

// ===== Address Types =====

export interface Address {
	cep: string;
	logradouro: string;
	numero: string;
	bairro: string;
	cidade: string;
	estado: string;
	complemento?: string;
}

// ===== Filter Types =====

export interface FilterOption {
	Id: number;
	Nome: string;
	descricao?: string;
}

export interface FilterOptionInstrument {
	Id: number;
	Nome: string;
	IdTipoEquipamento: number;
	NomeTipoEquipamento: string;
}

export interface FilterHomeImage {
	Id: number;
	Link: string;
}

export type FilterType =
	| "TipoFiltro"
	| "Categoria"
	| "Cidade"
	| "TipoEvento"
	| "GeneroMusical"
	| "TipoInstrumento"
	| "RedeSocial"
	| "TipoProducao"
	| "FormaPagamento"
	| "CondicoesPagamento"
	| "CondicoesPagamentoRestante"
	| "MotivoRejeicaoProposta"
	| "HomePageImagens";

export interface FilePropsLocal {
	id: number | null;
	link: string;
}

export interface FileProps {
	id: number;
	link: string;
}

export interface Category {
	Id: number;
	Nome: string;
	descricao?: string;
}

export interface City {
	Id: number;
	Nome: string;
	codigo: number;
	estado: string;
}

export interface EventType {
	Id: number;
	Nome: string;
	descricao?: string;
}

export interface MusicalGenre {
	Id: number;
	Nome: string;
	descricao?: string;
}

// ===== Social Network Types =====

export interface SocialNetwork {
	id: number;
	idRedeSocial: number;
	link: string;
	nome?: string;
}

// ===== Booking Status =====

export enum BookingStatus {
	PENDING = "pending",
	CONFIRMED = "confirmed",
	CANCELLED = "cancelled",
	COMPLETED = "completed",
}

// ===== User Types =====

export interface User {
	id: number;
	email: string;
	nome: string;
	telefoneWhatsApp?: string;
	cpf?: string;
	ativo: boolean;
	userType?: "cliente" | "produto_musical";
	createdAt?: string;
	updatedAt?: string;
	musicalProducts?: Array<MusicalProduct>;
}

export interface CreateUserRequest {
	email: string;
	nome: string;
	telefoneWhatsApp?: string;
	senha: string;
	cpf?: string;
	userType?: "cliente" | "produto_musical";
}

export interface UpdateUserRequest {
	id: number;
	email?: string;
	nome?: string;
	telefoneWhatsApp?: string;
	senha?: string;
	cpf?: string;
	ativo?: boolean;
}

export interface LoginRequest {
	email: string;
	senha: string;
}

export interface LoginResponse {
	Token: string; // Changed to match API response format
	token?: string; // Keep for backward compatibility
	refreshToken?: string;
	user?: User;
	userType?: "cliente" | "produto_musical";
	expiresIn?: number;
}

export interface RefreshTokenRequest {
	refreshToken: string;
}

export interface ForgotPasswordRequest {
	email: string;
}

export interface ResetPasswordRequest {
	token: string;
	novaSenha: string;
}

export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}

export interface UserProfile {
	id: number;
	email: string;
	nome: string;
	telefoneWhatsApp: string;
	cpf?: string;
	bio?: string;
	avatar?: string;
	preferences?: Record<string, unknown>;
}

export interface UserSettings {
	notifications: {
		email: boolean;
		push: boolean;
		sms: boolean;
	};
	privacy: {
		profileVisible: boolean;
		contactVisible: boolean;
	};
	theme: "light" | "dark" | "auto";
}

// ===== Musical Product Types =====
// export interface MusicalProduct extends MusicalProductApiResponse {}

export interface CreateMusicalProductRequest {
	nome: string;
	descricao: string;
	idCategoria: number;
	codigoMunicipio: number;
	tiposEvento: Array<number>;
	generosMusicais: Array<number>;
	tipoProducao: Array<number>;
	podeDeslocamento: boolean;
	valorServico?: number;
	exibirValorServico: boolean;
}

export interface MusicalProductFilters {
	codigoMunicipio?: number;
	categorias: Array<number>;
	tiposEvento: Array<number>;
	generosMusicais: Array<number>;
	limite: number;
	ordenarPorAvaliacao: boolean;
	tamanhoPagina: number;
	pagina: number;
}

// ===== Musical Product Search Types =====

export interface MusicalProductSearchRequest {
	codigoMunicipio?: number;
	categorias?: Array<number>;
	tiposEvento?: Array<number>;
	generosMusicais?: Array<number>;
	NomeOuDescricao?: string;
	limite: number;
	ordenarPorAvaliacao: boolean;
	tamanhoPagina: number;
	pagina: number;
}

export interface MusicalProductListResponse {
	data: Array<MusicalProduct>;
	pagination: {
		currentPage: number;
		totalPages: number;
		totalItems: number;
		itemsPerPage: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}

// ===== Booking Types =====

export interface Booking {
	id: number;
	produtoMusicalId: number;
	produtoMusical?: MusicalProduct;
	usuarioId: number;
	usuario?: User;
	dataEvento: string;
	horaInicio: string;
	horaFim: string;
	local: string;
	endereco: Address;
	valor: number;
	status: BookingStatus;
	observacoes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateBookingRequest {
	produtoMusicalId: number;
	dataEvento: string;
	horaInicio: string;
	horaFim: string;
	local: string;
	endereco: Address;
	valor: number;
	observacoes?: string;
}

export interface UpdateBookingRequest {
	id: number;
	dataEvento?: string;
	horaInicio?: string;
	horaFim?: string;
	local?: string;
	endereco?: Address;
	valor?: number;
	status?: BookingStatus;
	observacoes?: string;
}

export interface RedeSocial {
	idProdutoMusical: number;
	idRedeSocial: number;
	link: string;
	nomeRedeSocial: string;
}

// Real API Response Types (based on actual API structure)
export interface MusicalProductApiResponse {
	id: number;
	ativo: boolean;
	nome: string;
	descricao: string;
	usuario: {
		id: number;
		nome: string;
	};
	categoria: {
		id: number;
		nome: string;
	};
	cidade: {
		id: number;
		nome: string; // format: "São Paulo - SP"
	};
	avaliacao: number | null;
	podeDeslocamento: boolean;
	spotifyPlaylistId: string | null;
	tipoEvento: Array<{
		id: number;
		nome: string;
	}>;
	generoMusical: Array<{
		id: number;
		nome: string;
	}>;
	redeSocial: Array<RedeSocial>;
	videosYouTube: Array<FileProps>;
	imagens: Array<FileProps>;
	clipagem: Array<FileProps>;
	mapaPalcoLink: string | null;
	mapaPalco: Array<{
		idProdutoMusical: number;
		idInstrumento: number;
		posicaoX: number;
		posicaoY: number;
		nomeInstrumento: string;
	}>;
	tiposProducao: Array<{
		id: number;
		nome: string;
	}>;
	usaCnpj: boolean;
	cnpj: string | null;
	cpf?: string | null;
	razaoSocial: string | null;
	telefone: string | null;
	cepContato: string | null;
	logradouroContato: string | null;
	numeroContato: string | null;
	bairroContato: string | null;
	cidadeContato: string | null;
	estadoContato: string | null;
	complementoContato: string | null;
	email: string | null;
	fotoPerfil: string | null;
	logomarca: string | null;
	exibirValorServico: boolean;
	valorServico: number | null;
	camarimIncluso: boolean;
	rider: string | null; // Send file link in Azure.
	riderTexto: string | null; // Send rider text
	infraCamarim: string | null;
	infraCamarimTexto: string | null;
	numeroIntegrantes?: number | null;
}

export interface MusicalProductListApiResponse {
	dados: Array<MusicalProductApiResponse>;
	paginacao: {
		paginaAtual: number;
		totalPaginas: number;
		totalItens: number;
		itensPorPagina: number;
		temProximaPagina: boolean;
		temPaginaAnterior: boolean;
	};
}

export interface UserApiResponse {
	ativo: boolean;
	bairro: string;
	cep: string;
	cidade: string;
	complemento: string;
	cpfOuCnpj: string;
	email: string;
	estado: string;
	logradouro: string;
	nome: string;
	numero: string | null;
	telefone?: string | null;
}

// ===== Musical Product Types =====
export type MusicalProduct = MusicalProductApiResponse;

// ===== Onboarding Types =====
export interface OnboardingApiResponse extends MusicalProductApiResponse {
	etapaCadastro: number;
	idCadastro: number;
	numeroIntegrantes: number;
}

export interface MusicalProductContact {
	id: number;
	usaCnpj: boolean;
	cnpj?: string | null;
	cpf?: string | null;
	nome?: string | null;
	email?: string;
	razaoSocial?: string;
	telefone?: string;
	cepContato?: string;
	logradouroContato?: string;
	numeroContato?: string;
	bairroContato?: string;
	cidadeContato?: string;
	estadoContato?: string;
	complementoContato?: string;
}

export interface MusicalProductDetails {
	nome: string;
	idCategoria: number;
	descricao: string;
	podeDeslocamento: boolean;
	codigoMunicipio: number;
	tipoEvento: Array<number>;
	generoMusical: Array<number>;
	tipoProducao: Array<number>;
	numeroIntegrantes: number;
}

export interface MusicalProductMedia {
	videosYouTube: Array<string>;
	spotifyPlaylistId?: string | null;
	exibirValorServico: boolean;
	valorServico?: number | null;
	redeSocial: Array<{
		idRedeSocial: number;
		link: string;
	}>;
}

export interface MusicalProductImages {
	FotoPerfil?: string | null;
	Logomarca?: string | null;
	ImagensCarrossel: Array<string>;
}

export interface MusicalProductTechnicalConfig {
	rider?: string | null;
	riderText?: string | null;
	infraCamarim?: string | null;
	infraCamarimTexto?: string | null;
	camarimIncluso: boolean;
	mapaPalco: Array<{
		idInstrumento: number;
		posicaoX: number;
		posicaoY: number;
	}>;
	clipagem: Array<string>;
}

export interface MusicalProductSchedule {
	id: number;
	inicioCalendario?: string | null;
	finalCalendario?: string | null;
	compromissos: Array<{
		data: string;
		horaInicio: string;
		horaFim: string;
		disponibilidadeOutrosEventos: boolean;
		titulo: string;
		descricao?: string;
	}>;
}

// API Response format for schedule (GET)
export interface ScheduleApiResponse {
	data: string;
	status: "Livre" | "Ocupado";
	compromissos: Array<{
		id: number;
		horaInicio: string;
		horaFim: string;
		disponibilidadeOutrosEventos: boolean;
		titulo: string;
		descricao?: string;
	}>;
}

// ===== Favorites Types =====

export interface FavoriteRequest {
	produtoMusicalId: number;
}

// ===== Document Types =====

export interface Document {
	id: number;
	titulo: string;
	conteudo: string;
	tipo: string;
	ativo: boolean;
	createdAt: string;
	updatedAt: string;
}

// ===== Image Upload Types =====

export type FileEventType =
	| "ProdutoMusicalOnboardingFotoPerfil"
	| "ProdutoMusicalOnboardingLogomarca"
	| "ProdutoMusicalOnboardingCarrossel"
	| "ProdutoMusicalOnboardingRider"
	| "ProdutoMusicalOnboardingInfraCamarim"
	| "ProdutoMusicalOnboardingMapaPalco"
	| "ProdutoMusicalOnboardingClipagem"
	| "ProdutoMusicalFotoPerfil"
	| "ProdutoMusicalLogomarca"
	| "ProdutoMusicalCarrossel"
	| "ProdutoMusicalRider"
	| "ProdutoMusicalInfraCamarim"
	| "ProdutoMusicalMapaPalco"
	| "ProdutoMusicalClipagem";

export interface ImageUploadRequest {
	evento: FileEventType;
	idCadastro: string | number;
	idLista?: number;
	extensaoArquivo: string;
}

export interface ImageUploadResponse {
	url: string;
	expiresAt: string;
}

export interface ImageDeleteRequest {
	evento: FileEventType;
	idCadastro: number;
	idLista?: number | null;
}

// ===== Error Types =====

export interface ApiError {
	message: string;
	status: number;
	errors?: Array<{
		propertyName: string;
		errorMessage: string;
	}>;
}

// ===== Validation Types =====

export interface ValidationError {
	propertyName: string;
	errorMessage: string;
}

// ===== Performance Monitoring Types =====

export interface PerformanceMetrics {
	responseTime: number;
	timestamp: number;
	endpoint: string;
	method: string;
	status: number;
}

// ===== WebSocket Types =====

export interface WebSocketConnectionConfig {
	url: string;
	protocols?: Array<string>;
	reconnect?: boolean;
	maxReconnectAttempts?: number;
	reconnectInterval?: number;
}

export interface SendMessageRequest {
	conversationId: string;
	receiverId: string;
	content: string;
	type?: "text" | "image" | "audio" | "file";
	metadata?: Record<string, unknown>;
}

export interface Notification {
	id: string;
	userId: string;
	type: "booking" | "message" | "system" | "payment";
	title: string;
	message: string;
	read: boolean;
	data?: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

// WebSocket-related types
export interface BookingUpdate {
	bookingId: string;
	status: "confirmed" | "cancelled" | "completed" | "updated";
	updates: Record<string, unknown>;
	timestamp: string;
}

export interface NotificationData {
	id: string;
	type: "booking" | "message" | "system" | "payment";
	title: string;
	message: string;
	data?: Record<string, unknown>;
	timestamp: string;
}

export interface UserStatus {
	userId: string;
	status: "online" | "offline" | "away" | "busy";
	lastSeen?: string;
	timestamp: string;
}

export interface ConversationUpdate {
	conversationId: string;
	type: "message_added" | "user_joined" | "user_left" | "updated";
	data: Record<string, unknown>;
	timestamp: string;
}

// ===== Cache Types =====

export interface CacheEntry<T = unknown> {
	data: T;
	timestamp: number;
	expiry: number;
}

export interface CacheConfig {
	ttl?: number;
	maxSize?: number;
	strategy?: "lru" | "fifo";
}

// ===== Environment Types =====

export interface EnvironmentConfig {
	apiUrl: string;
	wsUrl?: string;
	environment: "development" | "staging" | "production";
	features: {
		[key: string]: boolean;
	};
	monitoring: {
		enabled: boolean;
		endpoint?: string;
	};
}

// ===== API Client Types =====

export interface ApiClientConfig {
	baseURL: string;
	timeout?: number;
	headers?: Record<string, string>;
	retryAttempts?: number;
	retryDelay?: number;
}

export interface ApiClient {
	get<T>(url: string, config?: unknown): Promise<T>;
	post<T>(url: string, data?: unknown, config?: unknown): Promise<T>;
	put<T>(url: string, data?: unknown, config?: unknown): Promise<T>;
	delete<T>(url: string, config?: unknown): Promise<T>;
	patch<T>(url: string, data?: unknown, config?: unknown): Promise<T>;
}

// ===== Rate Limiter Types =====

export interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
	skipSuccessfulRequests?: boolean;
	skipFailedRequests?: boolean;
}

export interface RateLimitInfo {
	limit: number;
	remaining: number;
	reset: number;
}

// ===== Utility Types =====

export interface Report {
	id: number;
	titulo: string;
	tipo: string;
	dados: unknown;
	createdAt: string;
}

export interface CreateReportRequest {
	titulo: string;
	tipo: string;
	dados: unknown;
}

export interface SearchSuggestion {
	text: string;
	type: "artist" | "genre" | "location";
	count?: number;
}

// Proposal types
export interface CreateProposalRequest {
	idConversa: number;
	nomeContratante: string;
	idProdutoMusical: number;
	idTipoEvento: number;
	descricao: string;
	valor: number;
	local: string;
	dataInicio: string;
	dataFim: string;
	horaInicio: string;
	horaFim: string;
	idFormaPagamento: number;
	idCondicoesPagamento: number;
	idCondicoesPagamentoRestante?: number | null;
	tipoSinalPagamento?: "P" | "V" | null;
	valorSinalPagamento?: number | null;
	dataVencimentoSinalPagamento?: string | null;
	transporteIncluso?: boolean;
	acomodacaoInclusa?: boolean;
	camarimIncluso?: boolean;
}

export interface ProposalFilterRequest {
	Id?: number | null;
	IdentificadorUnico?: string | null;
	IdContratante?: number | null;
	IdProdutoMusical?: number | null;
	DataDe?: string | null;
	DataAte?: string | null;
}

export interface ProposalResponse {
	id: number;
	identificadorUnico: string;
	contratante: {
		id: number;
		nome: string;
	};
	produtoMusical: {
		id: number;
		nome: string;
	};
	tipoEvento: {
		id: number;
		nome: string;
	};
	descricao: string;
	valor: number;
	local: string;
	dataInicio: string;
	dataFim: string;
	horaInicio: string;
	horaFim: string;
	transporteIncluso: boolean;
	acomodacaoInclusa: boolean;
	camarimIncluso: boolean;
	formaPagamento: {
		id: number;
		nome: string;
	};
	condicoesPagamento: {
		id: number;
		nome: string;
	};
	condicoesPagamentoRestante: {
		id: number;
		nome: string;
	} | null;
	tipoSinalPagamento: string | null;
	valorSinalPagamento: number | null;
	dataVencimentoSinalPagamento: string | null;
	status: {
		id: number;
		nome: string;
	};
	motivoRejeicao: {
		id: number;
		nome: string;
	} | null;
	assinaturaContratante: boolean;
	dataAssinaturaContratante: string | null;
	assinaturaContratado: boolean;
	dataAssinaturaContratado: string | null;
	dataCriacao: string;
	dataAtualizacao: string;
	idContratoDigital: string;
	// Contract ID if proposal was accepted and contract was generated
	idContrato?: number;
	// Backward compatibility properties
	idProdutoMusical?: number;
	idContratante?: number;
	idTipoEvento?: number;
	nomeContratante?: string;
	nomeTipoEvento?: string;
	nomeProdutoMusical?: string;
}

// ===== Reports and Analytics Types =====

export interface SalesReportsResponse {
	vendasPeriodo: number;
	cliquesPerfil: number;
	mensagensTrocadas: number;
	showsRealizados: number;
	aparicaoBuscas: number;
	comparativoMesAnterior: {
		vendas: number; // percentual
		cliques: number; // percentual
		mensagens: number; // percentual
		shows: number; // percentual
	};
}

export interface DashboardMetricsResponse {
	metrics: Array<{
		label: string;
		value: number;
		percentage: number;
		isUp: boolean;
		icon: string; // nome do ícone do Lucide
	}>;
}

// ===== Sales Chart Types =====

export interface SalesChartResponse {
	labels: Array<string>; // datas formatadas
	values: Array<number>; // valores das vendas
	periodo: string;
	totalVendas: number;
	crescimentoPercentual: number;
}

// ===== Contract Types =====

export interface ContractResponse {
	id: number;
	identificadorUnico: string;
	contratante: {
		id: number;
		nome: string;
	};
	produtoMusical: {
		id: number;
		nome: string;
	};
	tipoEvento: {
		id: number;
		nome: string;
	};
	descricao: string;
	valor: number;
	local: string;
	dataInicio: string;
	dataFim: string;
	horaInicio: string;
	horaFim: string;
	transporteIncluso: boolean;
	acomodacaoInclusa: boolean;
	camarimIncluso: boolean;
	formaPagamento: {
		id: number;
		nome: string;
	};
	condicoesPagamento: {
		id: number;
		nome: string;
	};
	condicoesPagamentoRestante: {
		id: number;
		nome: string;
	} | null;
	tipoSinalPagamento: string | null;
	valorSinalPagamento: number | null;
	dataVencimentoSinalPagamento: string | null;
	status: {
		id: number;
		nome: string;
	};
	motivoRejeicao: string | null;
	assinaturaContratante: boolean;
	dataAssinaturaContratante: string | null;
	assinaturaContratado: boolean;
	dataAssinaturaContratado: string | null;
	dataCriacao: string;
	dataAtualizacao: string;
	idContratoDigital: string;
	secoes?: Array<ContractSection>;
	// Additional computed fields
	titulo?: string;
	valorTotal?: number;
	idProposta?: number;
	nomeContratante?: string;
	nomeProdutoMusical?: string;
	// D4Sign integration fields
	urlAssinaturaD4Sign?: string;
}

export interface ContractSection {
	numero: number;
	titulo: string;
	texto: string;
	editavel: boolean;
	ordem?: number;
}

export interface ContractSectionUpdateRequest {
	numero: number;
	titulo: string;
	texto: string;
}

export type ContractStatus =
	| "rascunho"
	| "assinatura_pendente"
	| "ativo"
	| "concluido"
	| "cancelado";

// ===== D4Sign Webhook Types =====

export interface D4SignWebhookPayload {
	uuid: string;
	type_post: string;
	message: string;
	email: string;
}

export interface D4SignWebhookResponse {
	success: boolean;
	message: string;
	contractId?: number;
	proposalId?: number;
}

export interface D4SignContingencyPayload {
	uuid: string;
	type_post: string;
	message: string;
	email: string;
}

export interface D4SignContingencyResponse {
	success: boolean;
	message: string;
	contractId?: number;
	proposalId?: number;
}

// ===== Advanced Filtering Types =====

export type ProposalStatus =
	| "pendente"
	| "aguardando_pagamento"
	| "aceito"
	| "concluido"
	| "rejeitado"
	| "cancelado";

// ===== Period Types =====

export type ReportPeriod = "7d" | "30d" | "90d" | "1y";
export type ChartPeriod = "7d" | "30d" | "90d" | "1y";
export type ReportType = "vendas" | "propostas" | "geral";

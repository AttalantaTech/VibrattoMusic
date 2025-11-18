import { useState } from "react";
import {
	ChevronRight,
	Eye,
	EyeOff,
	DollarSign,
	UserIcon,
	InfoIcon,
	ImageIcon,
	MapIcon,
	ToggleLeft,
	ToggleRight,
	TrashIcon,
	LockIcon,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { ContactTab } from "./ContactTab";
import { InfoTab } from "./InfoTab";
import { MidiaKitTab } from "./MidiaKitTab";
import { MapsTab } from "./MapsTab";
import { ToggleSwitch } from "../../forms/ToggleSwitch/ToggleSwitch";

const ConfigurationsInterface = () => {
	const [activeSection, setActiveSection] = useState("contato");
	const [passwordVisibility, setPasswordVisibility] = useState({
		current: false,
		new: false,
		confirm: false,
	});
	const [passwords, setPasswords] = useState({
		current: "",
		new: "",
		confirm: "",
	});
	const [isProfileActive, setIsProfileActive] = useState(true);

	const menuItems = [
		{ id: "contato", label: "Informações de Contato", icon: UserIcon },
		{ id: "profissional", label: "Informações Profissionais", icon: InfoIcon },
		{ id: "midia", label: "Mídia Kit e Visibilidade", icon: ImageIcon },
		{ id: "tecnico", label: "Mapas e Configurações Técnicas", icon: MapIcon },
		{
			id: "perfil-ativo",
			label: "Perfil Ativo",
			icon: isProfileActive ? ToggleRight : ToggleLeft,
		},
		{ id: "historico", label: "Histórico de Pagamentos", icon: DollarSign },
		{ id: "senha", label: "Senha", icon: LockIcon },
		{ id: "excluir", label: "Excluir Conta", icon: TrashIcon },
	];

	const paymentHistory = [
		{
			id: 1,
			type: "Show Empresarial",
			date: "24/12/2023 às 13:20",
			amount: "R$ 400,00",
		},
		{
			id: 2,
			type: "Show Empresarial",
			date: "24/12/2023 às 13:20",
			amount: "R$ 400,00",
		},
		{
			id: 3,
			type: "Show Empresarial",
			date: "24/12/2023 às 13:20",
			amount: "R$ 400,00",
		},
		{
			id: 4,
			type: "Show Empresarial",
			date: "24/12/2023 às 13:20",
			amount: "R$ 400,00",
		},
		{
			id: 5,
			type: "Show Empresarial",
			date: "24/12/2023 às 13:20",
			amount: "R$ 400,00",
		},
		{
			id: 6,
			type: "Show Empresarial",
			date: "24/12/2023 às 13:20",
			amount: "R$ 400,00",
		},
		{
			id: 7,
			type: "Show Empresarial",
			date: "24/12/2023 às 13:20",
			amount: "R$ 400,00",
		},
	];

	const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
		setPasswordVisibility((previous) => ({
			...previous,
			[field]: !previous[field],
		}));
	};

	const handlePasswordChange = (
		field: "current" | "new" | "confirm",
		value: string
	) => {
		setPasswords((previous) => ({
			...previous,
			[field]: value,
		}));
	};

	const renderPasswordSection = () => (
		<div className="flex-1 p-8">
			<div className="max-w-md">
				{/* Header */}
				<div className="flex items-center mb-8">
					<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
						<LockIcon className="w-4 h-4 text-blue-600" />
					</div>
					<h2 className="text-xl font-semibold text-gray-900">Senha</h2>
				</div>

				{/* Password Form */}
				<div className="space-y-6">
					{/* Current Password */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Senha Atual
						</label>
						<div className="relative">
							<input
								type={passwordVisibility.current ? "text" : "password"}
								value={passwords.current}
								onChange={(event) => {
									handlePasswordChange("current", event.target.value);
								}}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="••••••••"
							/>
							<button
								type="button"
								onClick={() => {
									togglePasswordVisibility("current");
								}}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								{passwordVisibility.current ? (
									<EyeOff className="w-5 h-5" />
								) : (
									<Eye className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>

					{/* New Password */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Nova Senha
						</label>
						<div className="relative">
							<input
								type={passwordVisibility.new ? "text" : "password"}
								value={passwords.new}
								onChange={(event) => {
									handlePasswordChange("new", event.target.value);
								}}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="••••••••"
							/>
							<button
								type="button"
								onClick={() => {
									togglePasswordVisibility("new");
								}}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								{passwordVisibility.new ? (
									<EyeOff className="w-5 h-5" />
								) : (
									<Eye className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>

					{/* Confirm Password */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Confirme sua Nova Senha
						</label>
						<div className="relative">
							<input
								type={passwordVisibility.confirm ? "text" : "password"}
								value={passwords.confirm}
								onChange={(event) => {
									handlePasswordChange("confirm", event.target.value);
								}}
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								placeholder="••••••••"
							/>
							<button
								type="button"
								onClick={() => {
									togglePasswordVisibility("confirm");
								}}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								{passwordVisibility.confirm ? (
									<EyeOff className="w-5 h-5" />
								) : (
									<Eye className="w-5 h-5" />
								)}
							</button>
						</div>
					</div>

					{/* Forgot Password Link */}
					<div className="text-right">
						<button className="text-sm text-gray-600 hover:text-gray-800 underline">
							Esqueci minha senha
						</button>
					</div>

					{/* Save Button */}
					<button className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium">
						Salvar Alterações
					</button>
				</div>
			</div>
		</div>
	);

	const renderPaymentHistorySection = () => (
		<div className="flex-1 p-8">
			{/* Header */}
			<div className="flex items-center mb-8">
				<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
					<DollarSign className="w-4 h-4 text-blue-600" />
				</div>
				<h2 className="text-xl font-semibold text-gray-900">
					Histórico de Pagamentos
				</h2>
			</div>

			{/* Payment List */}
			<div className="space-y-4">
				{paymentHistory.map((payment) => (
					<div
						key={payment.id}
						className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
					>
						<div className="flex items-center space-x-4">
							<div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
								<DollarSign className="w-4 h-4 text-green-600" />
							</div>
							<div>
								<h3 className="font-medium text-gray-900">{payment.type}</h3>
								<p className="text-sm text-gray-500">{payment.date}</p>
							</div>
						</div>
						<div className="text-green-600 font-semibold">
							+ {payment.amount}
						</div>
					</div>
				))}
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50 flex w-full">
			{/* Sidebar */}
			<div className="w-80 bg-white border-r border-gray-200">
				<div className="p-6">
					<h1 className="text-2xl font-bold text-gray-900 mb-8">
						Configurações
					</h1>

					<nav className="space-y-2">
						{menuItems.map((item) => (
							<button
								key={item.id}
								onClick={() => {
									setActiveSection(item.id);
								}}
								className={`w-full flex items-center justify-between p-4 rounded-lg text-left transition-colors ${
									activeSection === item.id
										? "bg-blue-50 text-blue-700 border border-blue-200"
										: "text-gray-700 hover:bg-gray-50"
								}`}
							>
								<div className="flex items-center gap-3">
									{item.icon && (
										<item.icon
											size={20}
											className={
												activeSection === item.id
													? "text-blue-700"
													: "text-gray-500"
											}
										/>
									)}
									<span
										className={`font-medium ${activeSection === item.id ? "text-blue-700" : ""}`}
									>
										{item.label}
									</span>
								</div>
								<ChevronRight
									className={`w-4 h-4 ${activeSection === item.id ? "text-blue-700" : "text-gray-400"}`}
								/>
							</button>
						))}
					</nav>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 bg-white overflow-y-auto">
				{activeSection === "contato" && <ContactTab />}
				{activeSection === "profissional" && <InfoTab />}
				{activeSection === "midia" && <MidiaKitTab />}
				{activeSection === "tecnico" && <MapsTab />}
				{activeSection === "perfil-ativo" && (
					<div className="flex-1 p-8">
						<div className="flex items-center mb-8">
							<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
								{isProfileActive ? (
									<ToggleRight className="w-4 h-4 text-blue-600" />
								) : (
									<ToggleLeft className="w-4 h-4 text-gray-600" />
								)}
							</div>
							<h2 className="text-xl font-semibold text-gray-900">
								Status do Perfil
							</h2>
						</div>
						<div className="max-w-2xl">
							<p className="text-gray-600 mb-6">
								Controle a visibilidade do seu perfil na plataforma. Quando
								desativado, seu perfil não aparecerá nas buscas e você não
								receberá novas solicitações.
							</p>
							<div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
								<ToggleSwitch
									checked={isProfileActive}
									label="Perfil ativo na plataforma"
									name="profile-active"
									setChecked={setIsProfileActive}
								/>
								<p className="text-sm text-gray-500 mt-3 ml-12">
									{isProfileActive
										? "Seu perfil está visível e você pode receber propostas"
										: "Seu perfil está oculto e você não receberá novas propostas"}
								</p>
							</div>
							<div className="mt-6">
								<Button
									variant={isProfileActive ? "outline" : "primary"}
									onClick={() => {
										console.log("Salvar status:", isProfileActive);
									}}
								>
									Salvar Alterações
								</Button>
							</div>
						</div>
					</div>
				)}
				{activeSection === "senha" && renderPasswordSection()}
				{activeSection === "historico" && renderPaymentHistorySection()}
				{activeSection === "excluir" && (
					<div className="flex-1 p-8">
						<div className="flex items-center mb-8">
							<div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
								<TrashIcon className="w-4 h-4 text-red-600" />
							</div>
							<h2 className="text-xl font-semibold text-gray-900">
								Excluir Conta
							</h2>
						</div>
						<p className="text-gray-600 mb-6">
							Esta ação é permanente e não pode ser desfeita. Todos os seus
							dados serão removidos da plataforma.
						</p>
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
							<p className="text-red-800 text-sm">
								<strong>Atenção:</strong> Ao excluir sua conta, você perderá:
							</p>
							<ul className="list-disc list-inside text-red-700 text-sm mt-2">
								<li>Todos os seus dados de perfil</li>
								<li>Histórico de apresentações e contratos</li>
								<li>Mensagens e conversas</li>
								<li>Avaliações e comentários</li>
							</ul>
						</div>
						<div className="flex justify-end">
							<Button
								variant="danger"
								onClick={() => {
									console.log("Excluir conta");
								}}
							>
								Excluir minha conta permanentemente
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export const SettingsTab = ConfigurationsInterface;
export default ConfigurationsInterface;

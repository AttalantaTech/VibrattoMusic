import { useState } from "react";
import {
	User,
	Lock,
	Bell,
	Shield,
	CreditCard,
	HelpCircle,
	LogOut,
	ChevronRight,
	Eye,
	EyeOff,
	Save,
	Moon,
	Sun,
	Globe,
	Smartphone,
	Mail,
	MessageSquare,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { useAuthStore } from "../../../store/authStore";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

interface SettingsSectionProps {
	title: string;
	description?: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

const SettingsSection = ({
	title,
	description,
	icon,
	children,
	className = "",
}: SettingsSectionProps) => (
	<div
		className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
	>
		<div className="flex items-start gap-4 mb-6">
			<div className="p-2 bg-primary-50 rounded-lg text-primary-600">
				{icon}
			</div>
			<div className="flex-1">
				<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
				{description && (
					<p className="text-sm text-gray-600 mt-1">{description}</p>
				)}
			</div>
		</div>
		{children}
	</div>
);

export const ImprovedSettingsTab = () => {
	const router = useRouter();
	const { user, logout } = useAuthStore();
	const [activeSection, setActiveSection] = useState("profile");
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [showPasswords, setShowPasswords] = useState({
		current: false,
		new: false,
		confirm: false,
	});
	const [passwords, setPasswords] = useState({
		current: "",
		new: "",
		confirm: "",
	});

	// Notification preferences
	const [notifications, setNotifications] = useState({
		email: true,
		push: false,
		sms: false,
		proposalReceived: true,
		proposalAccepted: true,
		messageReceived: true,
		paymentReceived: true,
		weeklyReport: false,
	});

	// Privacy settings
	const [privacy, setPrivacy] = useState({
		profilePublic: true,
		showContact: true,
		showPrice: false,
		allowMessages: true,
		showAvailability: true,
	});

	// Theme and language
	const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
	const [language, setLanguage] = useState("pt-BR");

	const handlePasswordChange = async () => {
		if (passwords.new !== passwords.confirm) {
			toast.error("As senhas não coincidem");
			return;
		}
		if (passwords.new.length < 6) {
			toast.error("A nova senha deve ter pelo menos 6 caracteres");
			return;
		}

		// TODO: Implement password change API call
		toast.success("Senha alterada com sucesso!");
		setIsChangingPassword(false);
		setPasswords({ current: "", new: "", confirm: "" });
	};

	const handleLogout = () => {
		logout();
		void router.navigate({ to: "/login" });
	};

	const handleDeleteAccount = () => {
		if (
			confirm(
				"Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita."
			)
		) {
			// TODO: Implement account deletion
			toast.error("Função em desenvolvimento");
		}
	};

	const sidebarItems = [
		{ id: "profile", label: "Perfil", icon: <User size={20} /> },
		{ id: "notifications", label: "Notificações", icon: <Bell size={20} /> },
		{ id: "privacy", label: "Privacidade", icon: <Shield size={20} /> },
		{ id: "security", label: "Segurança", icon: <Lock size={20} /> },
		{ id: "billing", label: "Pagamentos", icon: <CreditCard size={20} /> },
		{ id: "preferences", label: "Preferências", icon: <Globe size={20} /> },
		{ id: "help", label: "Ajuda", icon: <HelpCircle size={20} /> },
	];

	const renderContent = () => {
		switch (activeSection) {
			case "profile":
				return (
					<SettingsSection
						title="Informações do Perfil"
						description="Gerencie suas informações pessoais e profissionais"
						icon={<User size={24} />}
					>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Nome Completo
								</label>
								<input
									type="text"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									defaultValue={user?.nome}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Email
								</label>
								<input
									type="email"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									defaultValue={user?.email}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									WhatsApp
								</label>
								<input
									type="tel"
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									defaultValue={user?.telefoneWhatsApp}
									placeholder="(11) 99999-9999"
								/>
							</div>
							<div className="pt-4">
								<Button className="flex items-center gap-2">
									<Save size={18} />
									Salvar Alterações
								</Button>
							</div>
						</div>
					</SettingsSection>
				);

			case "notifications":
				return (
					<SettingsSection
						title="Configurações de Notificações"
						description="Escolha como e quando deseja receber notificações"
						icon={<Bell size={24} />}
					>
						<div className="space-y-6">
							<div>
								<h4 className="font-medium text-gray-900 mb-3">
									Canais de Notificação
								</h4>
								<div className="space-y-3">
									{[
										{ key: "email", label: "Email", icon: <Mail size={18} /> },
										{
											key: "push",
											label: "Push (Navegador)",
											icon: <Smartphone size={18} />,
										},
										{
											key: "sms",
											label: "SMS",
											icon: <MessageSquare size={18} />,
										},
									].map(({ key, label, icon }) => (
										<label
											key={key}
											className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
										>
											<div className="flex items-center gap-3">
												{icon}
												<span className="text-gray-700">{label}</span>
											</div>
											<input
												type="checkbox"
												checked={
													notifications[key as keyof typeof notifications]
												}
												onChange={(e) => {
													setNotifications({
														...notifications,
														[key]: e.target.checked,
													});
												}}
												className="w-5 h-5 text-primary-600 rounded focus:ring-blue-500"
											/>
										</label>
									))}
								</div>
							</div>

							<div>
								<h4 className="font-medium text-gray-900 mb-3">
									Tipos de Notificação
								</h4>
								<div className="space-y-2">
									{[
										{
											key: "proposalReceived",
											label: "Nova proposta recebida",
										},
										{ key: "proposalAccepted", label: "Proposta aceita" },
										{ key: "messageReceived", label: "Nova mensagem" },
										{ key: "paymentReceived", label: "Pagamento recebido" },
										{ key: "weeklyReport", label: "Relatório semanal" },
									].map(({ key, label }) => (
										<label
											key={key}
											className="flex items-center justify-between py-2"
										>
											<span className="text-gray-700">{label}</span>
											<input
												type="checkbox"
												checked={
													notifications[key as keyof typeof notifications]
												}
												onChange={(e) => {
													setNotifications({
														...notifications,
														[key]: e.target.checked,
													});
												}}
												className="w-5 h-5 text-primary-600 rounded focus:ring-blue-500"
											/>
										</label>
									))}
								</div>
							</div>
						</div>
					</SettingsSection>
				);

			case "privacy":
				return (
					<SettingsSection
						title="Configurações de Privacidade"
						description="Controle quem pode ver suas informações"
						icon={<Shield size={24} />}
					>
						<div className="space-y-4">
							{[
								{
									key: "profilePublic",
									label: "Perfil público",
									description: "Seu perfil pode ser encontrado em buscas",
								},
								{
									key: "showContact",
									label: "Mostrar informações de contato",
									description: "Exibir telefone e email no perfil",
								},
								{
									key: "showPrice",
									label: "Mostrar valores de serviço",
									description: "Exibir faixa de preço no perfil",
								},
								{
									key: "allowMessages",
									label: "Permitir mensagens",
									description: "Receber mensagens de novos contatos",
								},
								{
									key: "showAvailability",
									label: "Mostrar disponibilidade",
									description: "Exibir agenda disponível",
								},
							].map(({ key, label, description }) => (
								<div
									key={key}
									className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0"
								>
									<div className="flex-1">
										<p className="font-medium text-gray-900">{label}</p>
										<p className="text-sm text-gray-600">{description}</p>
									</div>
									<button
										onClick={() => {
											setPrivacy({
												...privacy,
												[key]: !privacy[key as keyof typeof privacy],
											});
										}}
										className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
											privacy[key as keyof typeof privacy]
												? "bg-primary-600"
												: "bg-gray-200"
										}`}
									>
										<span
											className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
												privacy[key as keyof typeof privacy]
													? "translate-x-6"
													: "translate-x-1"
											}`}
										/>
									</button>
								</div>
							))}
						</div>
					</SettingsSection>
				);

			case "security":
				return (
					<SettingsSection
						title="Segurança da Conta"
						description="Mantenha sua conta segura"
						icon={<Lock size={24} />}
					>
						<div className="space-y-6">
							{!isChangingPassword ? (
								<div>
									<h4 className="font-medium text-gray-900 mb-2">Senha</h4>
									<p className="text-sm text-gray-600 mb-4">
										Última alteração há 30 dias
									</p>
									<Button
										variant="outline"
										onClick={() => {
											setIsChangingPassword(true);
										}}
									>
										Alterar Senha
									</Button>
								</div>
							) : (
								<div className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Senha Atual
										</label>
										<div className="relative">
											<input
												type={showPasswords.current ? "text" : "password"}
												className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												value={passwords.current}
												onChange={(e) => {
													setPasswords({
														...passwords,
														current: e.target.value,
													});
												}}
											/>
											<button
												type="button"
												onClick={() => {
													setShowPasswords({
														...showPasswords,
														current: !showPasswords.current,
													});
												}}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
											>
												{showPasswords.current ? (
													<EyeOff size={20} />
												) : (
													<Eye size={20} />
												)}
											</button>
										</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Nova Senha
										</label>
										<div className="relative">
											<input
												type={showPasswords.new ? "text" : "password"}
												className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												value={passwords.new}
												onChange={(e) => {
													setPasswords({ ...passwords, new: e.target.value });
												}}
											/>
											<button
												type="button"
												onClick={() => {
													setShowPasswords({
														...showPasswords,
														new: !showPasswords.new,
													});
												}}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
											>
												{showPasswords.new ? (
													<EyeOff size={20} />
												) : (
													<Eye size={20} />
												)}
											</button>
										</div>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">
											Confirmar Nova Senha
										</label>
										<div className="relative">
											<input
												type={showPasswords.confirm ? "text" : "password"}
												className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
												value={passwords.confirm}
												onChange={(e) => {
													setPasswords({
														...passwords,
														confirm: e.target.value,
													});
												}}
											/>
											<button
												type="button"
												onClick={() => {
													setShowPasswords({
														...showPasswords,
														confirm: !showPasswords.confirm,
													});
												}}
												className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
											>
												{showPasswords.confirm ? (
													<EyeOff size={20} />
												) : (
													<Eye size={20} />
												)}
											</button>
										</div>
									</div>
									<div className="flex gap-2">
										<Button onClick={handlePasswordChange}>
											Salvar Nova Senha
										</Button>
										<Button
											variant="outline"
											onClick={() => {
												setIsChangingPassword(false);
												setPasswords({ current: "", new: "", confirm: "" });
											}}
										>
											Cancelar
										</Button>
									</div>
								</div>
							)}

							<div className="pt-6 border-t border-gray-200">
								<h4 className="font-medium text-gray-900 mb-2">
									Autenticação em Duas Etapas
								</h4>
								<p className="text-sm text-gray-600 mb-4">
									Adicione uma camada extra de segurança à sua conta
								</p>
								<Button variant="outline">Configurar 2FA</Button>
							</div>

							<div className="pt-6 border-t border-gray-200">
								<h4 className="font-medium text-red-600 mb-2">
									Zona de Perigo
								</h4>
								<p className="text-sm text-gray-600 mb-4">
									Ações irreversíveis para sua conta
								</p>
								<Button
									variant="outline"
									className="text-red-600 border-red-200 hover:bg-red-50"
									onClick={handleDeleteAccount}
								>
									Excluir Conta
								</Button>
							</div>
						</div>
					</SettingsSection>
				);

			case "preferences":
				return (
					<SettingsSection
						title="Preferências do Sistema"
						description="Personalize sua experiência"
						icon={<Globe size={24} />}
					>
						<div className="space-y-6">
							<div>
								<h4 className="font-medium text-gray-900 mb-3">Tema</h4>
								<div className="flex gap-2">
									{[
										{ value: "light", label: "Claro", icon: <Sun size={18} /> },
										{
											value: "dark",
											label: "Escuro",
											icon: <Moon size={18} />,
										},
										{
											value: "auto",
											label: "Automático",
											icon: <Globe size={18} />,
										},
									].map(({ value, label, icon }) => (
										<button
											key={value}
											onClick={() => {
												setTheme(value as typeof theme);
											}}
											className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
												theme === value
													? "border-primary-500 bg-primary-50 text-primary-600"
													: "border-gray-200 hover:border-gray-300"
											}`}
										>
											{icon}
											{label}
										</button>
									))}
								</div>
							</div>

							<div>
								<h4 className="font-medium text-gray-900 mb-3">Idioma</h4>
								<select
									value={language}
									onChange={(e) => {
										setLanguage(e.target.value);
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								>
									<option value="pt-BR">Português (Brasil)</option>
									<option value="en">English</option>
									<option value="es">Español</option>
								</select>
							</div>
						</div>
					</SettingsSection>
				);

			case "help":
				return (
					<SettingsSection
						title="Central de Ajuda"
						description="Encontre respostas e suporte"
						icon={<HelpCircle size={24} />}
					>
						<div className="space-y-4">
							<a
								href="#"
								className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
							>
								<div className="flex items-center justify-between">
									<div>
										<h4 className="font-medium text-gray-900">
											Perguntas Frequentes
										</h4>
										<p className="text-sm text-gray-600">
											Encontre respostas rápidas
										</p>
									</div>
									<ChevronRight size={20} className="text-gray-400" />
								</div>
							</a>
							<a
								href="#"
								className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
							>
								<div className="flex items-center justify-between">
									<div>
										<h4 className="font-medium text-gray-900">Tutoriais</h4>
										<p className="text-sm text-gray-600">
											Aprenda a usar a plataforma
										</p>
									</div>
									<ChevronRight size={20} className="text-gray-400" />
								</div>
							</a>
							<a
								href="#"
								className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
							>
								<div className="flex items-center justify-between">
									<div>
										<h4 className="font-medium text-gray-900">
											Contatar Suporte
										</h4>
										<p className="text-sm text-gray-600">
											Fale com nossa equipe
										</p>
									</div>
									<ChevronRight size={20} className="text-gray-400" />
								</div>
							</a>
						</div>
					</SettingsSection>
				);

			default:
				return null;
		}
	};

	return (
		<div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
			{/* Sidebar */}
			<div className="lg:w-64">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<nav className="space-y-1">
						{sidebarItems.map((item) => (
							<button
								key={item.id}
								onClick={() => {
									setActiveSection(item.id);
								}}
								className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
									activeSection === item.id
										? "bg-primary-50 text-primary-600"
										: "text-gray-700 hover:bg-gray-50"
								}`}
							>
								{item.icon}
								<span className="font-medium">{item.label}</span>
							</button>
						))}
						<hr className="my-4 border-gray-200" />
						<button
							onClick={handleLogout}
							className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
						>
							<LogOut size={20} />
							<span className="font-medium">Sair</span>
						</button>
					</nav>
				</div>
			</div>

			{/* Content */}
			<div className="flex-1">{renderContent()}</div>
		</div>
	);
};

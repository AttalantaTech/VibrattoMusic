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
	Smartphone,
	Mail,
	MessageSquare,
} from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { useAuthStore } from "../../../store/authStore";
import { SettingsSection } from "./SettingsSection";
import { ProfileSection } from "./ProfileSection";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

export const ImprovedSettingsTab = () => {
	const router = useRouter();
	const { logout } = useAuthStore();
	const [activeSection, setActiveSection] = useState("profile");
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
		{ id: "help", label: "Ajuda", icon: <HelpCircle size={20} /> },
	];

	const renderContent = () => {
		switch (activeSection) {
			case "profile":
				return <ProfileSection />;

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
							<ChangePasswordForm />

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

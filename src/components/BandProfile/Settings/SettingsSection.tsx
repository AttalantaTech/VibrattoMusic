interface SettingsSectionProps {
	title: string;
	description?: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

export const SettingsSection = ({
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

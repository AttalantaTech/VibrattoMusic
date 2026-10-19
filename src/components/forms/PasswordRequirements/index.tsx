import { Check, Circle } from "lucide-react";
import { PASSWORD_RULES } from "@/utils/password";

interface PasswordRequirementsProps {
	password?: string;
}

// Live checklist of the password policy, updated as the user types
export function PasswordRequirements({
	password = "",
}: PasswordRequirementsProps) {
	return (
		<ul className="mt-2 space-y-1 text-sm" aria-label="Requisitos da senha">
			{PASSWORD_RULES.map((rule) => {
				const isMet = rule.test(password);

				return (
					<li
						key={rule.id}
						className={`flex items-center gap-2 ${
							isMet ? "text-green-600" : "text-gray-500"
						}`}
					>
						{isMet ? (
							<Check size={14} aria-hidden="true" />
						) : (
							<Circle size={14} aria-hidden="true" />
						)}
						<span>
							{rule.label}
							<span className="sr-only">
								{isMet ? " (atendido)" : " (pendente)"}
							</span>
						</span>
					</li>
				);
			})}
		</ul>
	);
}

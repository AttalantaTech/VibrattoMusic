import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useProfileStatus } from "../../../hooks/useProfileStatus";

interface ProfileStatusBadgeProps {
	size?: "sm" | "md" | "lg";
	showText?: boolean;
	className?: string;
}

export const ProfileStatusBadge = ({
	size = "md",
	showText = true,
	className = ""
}: ProfileStatusBadgeProps) => {
	const { isProfileComplete, isProfileIncomplete, musicalProducts, isLoading } = useProfileStatus();

	if (isLoading) {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<Clock className={`animate-spin text-gray-400 ${
					size === "sm" ? "w-4 h-4" :
					size === "lg" ? "w-6 h-6" : "w-5 h-5"
				}`} />
				{showText && (
					<span className={`text-gray-500 ${
						size === "sm" ? "text-xs" :
						size === "lg" ? "text-base" : "text-sm"
					}`}>
						Verificando perfil...
					</span>
				)}
			</div>
		);
	}

	if (isProfileComplete) {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<CheckCircle className={`text-green-500 ${
					size === "sm" ? "w-4 h-4" :
					size === "lg" ? "w-6 h-6" : "w-5 h-5"
				}`} />
				{showText && (
					<span className={`text-green-700 font-medium ${
						size === "sm" ? "text-xs" :
						size === "lg" ? "text-base" : "text-sm"
					}`}>
						Perfil Completo
					</span>
				)}
			</div>
		);
	}

	if (isProfileIncomplete && musicalProducts && musicalProducts.length > 0) {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<AlertCircle className={`text-orange-500 ${
					size === "sm" ? "w-4 h-4" :
					size === "lg" ? "w-6 h-6" : "w-5 h-5"
				}`} />
				{showText && (
					<span className={`text-orange-700 font-medium ${
						size === "sm" ? "text-xs" :
						size === "lg" ? "text-base" : "text-sm"
					}`}>
						Perfil Incompleto
					</span>
				)}
			</div>
		);
	}

	// User doesn't have a musical product yet
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Clock className={`text-gray-400 ${
				size === "sm" ? "w-4 h-4" :
				size === "lg" ? "w-6 h-6" : "w-5 h-5"
			}`} />
			{showText && (
				<span className={`text-gray-500 ${
					size === "sm" ? "text-xs" :
					size === "lg" ? "text-base" : "text-sm"
				}`}>
					Cadastre seu produto musical
				</span>
			)}
		</div>
	);
};

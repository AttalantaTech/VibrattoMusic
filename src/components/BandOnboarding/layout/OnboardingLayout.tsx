import type React from "react";
import { AuthGuard } from "../../../components/auth/AuthGuard";

interface OnboardingLayoutProps {
	children: React.ReactNode;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
	children,
}) => {
	return (
		<AuthGuard>
			<div className="min-h-screen bg-gray-50">{children}</div>
		</AuthGuard>
	);
};

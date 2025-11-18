import { ReactNode } from "react";
import { useProfileStatus } from "../../../hooks/useProfileStatus";

interface ProfileGuardProps {
	children: ReactNode;
	fallback?: ReactNode;
	showModal?: boolean;
	onProfileIncomplete?: () => void;
}

export const ProfileGuard = ({
	children,
	fallback,
	showModal = true,
	onProfileIncomplete,
}: ProfileGuardProps) => {
	const { isProfileComplete } = useProfileStatus();

	if (isProfileComplete) {
		return <>{children}</>;
	}

	if (fallback) {
		return <>{fallback}</>;
	}

	if (showModal && onProfileIncomplete) {
		onProfileIncomplete();
	}

	return null;
};

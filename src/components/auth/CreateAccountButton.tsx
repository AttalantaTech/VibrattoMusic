import { UserPlus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/Button/Button";
import { saveSignupEmail } from "@/utils/signupEmail";

interface CreateAccountButtonProps {
	/** The e-mail typed in the login, which has no account yet */
	email: string;
}

/**
 * Shown when the login says the e-mail has no account (with password or
 * code): goes to the sign-up with the e-mail already filled in
 */
export const CreateAccountButton = ({ email }: CreateAccountButtonProps) => {
	const navigate = useNavigate();

	return (
		<Button
			className="w-full font-semibold flex gap-2"
			variant="outline"
			type="button"
			onClick={() => {
				saveSignupEmail(email);
				void navigate({ to: "/welcome" });
			}}
		>
			<UserPlus className="h-5 w-5" aria-hidden="true" />
			Criar conta com este e-mail
		</Button>
	);
};

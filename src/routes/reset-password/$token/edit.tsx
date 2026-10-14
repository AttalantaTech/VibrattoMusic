import { ResetPassword } from "@/routes/reset-password";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password/$token/edit")({
	component: ResetPassword,
});

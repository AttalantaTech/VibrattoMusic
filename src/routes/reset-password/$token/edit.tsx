import { ResetPassword } from "@/pages/reset-password/$token/edit";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password/$token/edit")({
	component: ResetPassword,
});

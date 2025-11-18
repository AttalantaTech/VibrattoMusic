import { createFileRoute } from "@tanstack/react-router";
import { AdminLogin } from "../../pages/Admin/AdminLogin";

export const Route = createFileRoute("/admin/login")({
	component: AdminLogin,
});

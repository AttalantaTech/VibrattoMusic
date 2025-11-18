import { createFileRoute } from "@tanstack/react-router";
import { UserTypeSelection } from "../pages/UserTypeSelection";

export const Route = createFileRoute("/welcome")({
	component: UserTypeSelection,
});

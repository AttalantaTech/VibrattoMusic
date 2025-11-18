import { createFileRoute } from "@tanstack/react-router";
import { SearchPage } from "../pages/Search";

export const Route = createFileRoute("/search")({
	component: SearchPage,
});

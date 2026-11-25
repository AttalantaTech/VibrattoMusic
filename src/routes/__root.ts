import { createRootRoute, Outlet } from "@tanstack/react-router";
import React from "react";
import { useRouteTitle } from "@/hooks/usePageTitle";

const Root = () => {
	// The browser tab shows the page: "Mensagens · Vibratto Music"
	useRouteTitle();
	return React.createElement(Outlet);
};

export const Route = createRootRoute({
	component: Root,
});

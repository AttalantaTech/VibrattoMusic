import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), TanStackRouterVite()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		host: true,
		port: 8000,
		strictPort: true,
		proxy: {
			"/api": {
				target:
					process.env.VITE_PROXY_TARGET ||
					"https://apivibratto-api-ctdqdacrascbhzcz.brazilsouth-01.azurewebsites.net",
				changeOrigin: true,
				rewrite: (path) => path,
				secure: true,
				ws: false,
			},
		},
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		css: true,
	},
	define: {
		"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
		"process.env.VITE_VIBRATTO_API_BASE_URL": JSON.stringify(
			process.env.VITE_VIBRATTO_API_BASE_URL
		),
	},
});

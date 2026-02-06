import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { Toaster } from "sonner";
import type { FunctionComponent } from "./common/types";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import { AuthProvider } from "./components/auth/AuthProvider";
import { NotificationContainer } from "./components/ui/Notification/Notification";

const queryClient = new QueryClient();

type AppProps = { router: AnyRouter };

const App = ({ router }: AppProps): FunctionComponent => {
	return (
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<RouterProvider router={router} />
					<Toaster position="top-right" richColors />
					<NotificationContainer />
				</AuthProvider>
			</QueryClientProvider>
		</ErrorBoundary>
	);
};

export default App;

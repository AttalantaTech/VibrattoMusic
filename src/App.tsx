import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, type AnyRouter } from "@tanstack/react-router";
import { Toaster } from "sonner";
import type { FunctionComponent } from "./common/types";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import { AuthProvider } from "./components/auth/AuthProvider";
import { NotificationContainer } from "./components/ui/Notification/Notification";
import { MessagesProvider } from "./contexts/MessagesContext";
import { FloatingWhatsApp } from "./FloatingWhatsApp";

const queryClient = new QueryClient();

type AppProps = { router: AnyRouter };

const App = ({ router }: AppProps): FunctionComponent => {
	return (
		<ErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<AuthProvider>
					<MessagesProvider>
						<RouterProvider router={router} />
						<Toaster position="top-right" richColors />
						<NotificationContainer />
						<FloatingWhatsApp />
					</MessagesProvider>
				</AuthProvider>
			</QueryClientProvider>
		</ErrorBoundary>
	);
};

export default App;

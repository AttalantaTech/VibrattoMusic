import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button/Button";

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	public constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Error caught by boundary:", error, errorInfo);
	}

	public resetError = () => {
		this.setState({ hasError: false, error: undefined });
	};

	public override render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				const FallbackComponent = this.props.fallback;
				return (
					<FallbackComponent
						error={this.state.error!}
						resetError={this.resetError}
					/>
				);
			}

			return (
				<div className="min-h-screen flex items-center justify-center bg-gray-50">
					<div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
						<div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
							<AlertTriangle className="w-6 h-6 text-red-600" />
						</div>
						<h1 className="text-xl font-bold text-gray-900 text-center mb-2">
							Algo deu errado
						</h1>
						<p className="text-gray-600 text-center mb-6">
							Ocorreu um erro inesperado. Por favor, tente novamente.
						</p>{" "}
						<div className="flex space-x-3">
							<Button
								className="flex-1"
								variant="outline"
								onClick={() => {
									window.location.reload();
								}}
							>
								Recarregar página
							</Button>
							<Button className="flex-1" onClick={this.resetError}>
								Tentar novamente
							</Button>
						</div>
						{process.env["NODE_ENV"] === "development" && this.state.error && (
							<details className="mt-4">
								<summary className="text-sm text-gray-500 cursor-pointer">
									Detalhes do erro (desenvolvimento)
								</summary>
								<pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
									{this.state.error.stack}
								</pre>
							</details>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

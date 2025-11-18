import React from "react";

/**
 * Loading skeleton for reports cards
 */
export const ReportsSkeleton: React.FC = () => {
	return (
		<div className="w-full flex flex-col gap-4">
			{/* Header skeleton */}
			<div className="flex w-full items-center justify-between">
				<div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
				<div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
			</div>

			{/* Cards grid skeleton */}
			<div className="flex items-center w-full justify-center">
				<div className="grid grid-cols-3 gap-4 w-full">
					{Array.from({ length: 6 }).map((_, index) => (
						<div key={index} className="flex w-full bg-gray-50 gap-12 rounded-md px-2 py-4 border border-gray-200 items-center">
							{/* Icon skeleton */}
							<div className="bg-gray-200 rounded-lg p-4 animate-pulse">
								<div className="w-6 h-6 bg-gray-300 rounded"></div>
							</div>

							{/* Content skeleton */}
							<div className="flex flex-col w-full gap-2">
								<div className="flex w-full items-center justify-between">
									<div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
									<div className="flex gap-1">
										<div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
										<div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
									</div>
								</div>
								<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

/**
 * Loading skeleton for chart component
 */
export const ChartSkeleton: React.FC = () => {
	return (
		<div className="w-full h-80 bg-white rounded-lg shadow-sm p-4">
			{/* Chart title skeleton */}
			<div className="h-6 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>

			{/* Chart area skeleton */}
			<div className="h-64 bg-gray-100 rounded animate-pulse">
				{/* Chart lines simulation */}
				<div className="flex flex-col h-full justify-between py-4">
					{Array.from({ length: 5 }).map((_, index) => (
						<div key={index} className="flex items-center">
							<div className="w-8 h-3 bg-gray-200 rounded mr-4 animate-pulse"></div>
							<div className={`h-1 bg-gray-300 rounded animate-pulse`} style={{
								width: `${Math.random() * 60 + 20}%`,
								animationDelay: `${index * 0.1}s`
							}}></div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

/**
 * Loading skeleton for table component
 */
export const TableSkeleton: React.FC = () => {
	return (
		<div className="space-y-4">
			{Array.from({ length: 5 }).map((_, index) => (
				<div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
					<div className="flex flex-col lg:flex-row justify-between gap-4">
						{/* Main content skeleton */}
						<div className="flex-1 space-y-3">
							{/* Header skeleton */}
							<div className="flex items-start justify-between gap-4">
								<div>
									<div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
									<div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
								</div>
								<div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
							</div>

							{/* Description skeleton */}
							<div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
							<div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>

							{/* Details grid skeleton */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
								{Array.from({ length: 4 }).map((_, detailIndex) => (
									<div key={detailIndex} className="flex items-center gap-2">
										<div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
										<div className="h-4 bg-gray-200 rounded animate-pulse" style={{
											width: `${Math.random() * 20 + 60}%`
										}}></div>
									</div>
								))}
							</div>

							{/* Footer skeleton */}
							<div className="flex items-center gap-4 text-xs">
								<div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
								<div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
							</div>
						</div>

						{/* Actions skeleton */}
						<div className="flex flex-row lg:flex-col gap-2 lg:justify-center">
							<div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
							<div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

/**
 * Loading skeleton for proposal details modal
 */
export const ProposalModalSkeleton: React.FC = () => {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					{/* Header skeleton */}
					<div className="flex justify-between items-start mb-6">
						<div>
							<div className="h-8 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
							<div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
						</div>
						<div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
					</div>

					{/* Status badge skeleton */}
					<div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>

					{/* Content skeleton */}
					<div className="space-y-6">
						{/* Event info skeleton */}
						<div>
							<div className="h-6 bg-gray-200 rounded w-40 mb-3 animate-pulse"></div>
							<div className="space-y-3">
								<div className="flex items-start gap-3">
									<div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
									<div>
										<div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
										<div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
									</div>
								</div>
								<div className="flex items-start gap-3">
									<div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
									<div>
										<div className="h-4 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
										<div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
									</div>
								</div>
							</div>
						</div>

						{/* Description skeleton */}
						<div>
							<div className="h-6 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>
							<div className="space-y-2">
								<div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
								<div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
								<div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
							</div>
						</div>

						{/* Details skeleton */}
						<div>
							<div className="h-6 bg-gray-200 rounded w-36 mb-3 animate-pulse"></div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								{Array.from({ length: 4 }).map((_, index) => (
									<div key={index} className="flex items-start gap-3">
										<div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
										<div>
											<div className="h-4 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
											<div className="h-5 bg-gray-200 rounded animate-pulse" style={{
												width: `${Math.random() * 20 + 60}%`
											}}></div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Footer skeleton */}
						<div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
					</div>

					{/* Actions skeleton */}
					<div className="mt-6 flex justify-end gap-3">
						<div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
						<div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
					</div>
				</div>
			</div>
		</div>
	);
};

/**
 * Generic loading spinner component
 */
export const LoadingSpinner: React.FC<{
	size?: "sm" | "md" | "lg";
	message?: string;
}> = ({ size = "md", message }) => {
	const sizeClasses = {
		sm: "w-4 h-4",
		md: "w-8 h-8",
		lg: "w-12 h-12"
	};

	return (
		<div className="flex flex-col items-center justify-center gap-2">
			<div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`}></div>
			{message && (
				<p className="text-sm text-gray-600">{message}</p>
			)}
		</div>
	);
};

/**
 * Full page loading state
 */
export const PageLoading: React.FC<{
	message?: string;
}> = ({ message = "Carregando..." }) => {
	return (
		<div className="flex items-center justify-center min-h-[400px]">
			<LoadingSpinner size="lg" message={message} />
		</div>
	);
};

/**
 * Error state component
 */
export const ErrorState: React.FC<{
	message?: string;
	onRetry?: () => void;
}> = ({ message = "Erro ao carregar dados", onRetry }) => {
	return (
		<div className="flex flex-col items-center justify-center min-h-[200px] text-center">
			<div className="text-red-500 mb-4">
				<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			</div>
			<h3 className="text-lg font-semibold text-gray-900 mb-2">Ops! Algo deu errado</h3>
			<p className="text-gray-600 mb-4">{message}</p>
			{onRetry && (
				<button
					onClick={onRetry}
					className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					Tentar novamente
				</button>
			)}
		</div>
	);
};

/**
 * Empty state component
 */
export const EmptyState: React.FC<{
	icon?: React.ReactNode;
	title: string;
	message: string;
	action?: React.ReactNode;
}> = ({ icon, title, message, action }) => {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
			{icon && (
				<div className="text-gray-400 mb-4">
					{icon}
				</div>
			)}
			<h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
			<p className="text-gray-600 text-center max-w-md mb-4">{message}</p>
			{action}
		</div>
	);
};

import { Header } from "../Header/Header";

interface MainLayoutProps {
	children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
	return (
		<div className="flex flex-col min-h-screen w-full overflow-x-hidden">
			<Header />
			{/* Spacer to compensate for fixed header */}
			<div className="h-16" />
			<main className="flex-1 w-full">{children}</main>
		</div>
	);
};

import { createFileRoute } from "@tanstack/react-router";
import { ContractSignaturePage } from "../../../pages/Band/ContractSignature";
import { AuthGuard } from "../../../components/auth/AuthGuard";

const ProtectedContractSignaturePage = () => {
	const { id } = Route.useParams();
	
	return (
		<AuthGuard>
			<ContractSignaturePage identificadorUnico={id} />
		</AuthGuard>
	);
};

export const Route = createFileRoute("/band/contract/$id")({
	component: ProtectedContractSignaturePage,
});

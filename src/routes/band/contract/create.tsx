import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "../../../components/auth/AuthGuard";
import { ContractCreate } from "../../../pages/Band/ContractCreate";

const ProtectedContractCreate = () => (
	<AuthGuard>
		<ContractCreate />
	</AuthGuard>
);

export const Route = createFileRoute("/band/contract/create")({
	component: ProtectedContractCreate,
});

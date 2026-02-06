import { User } from "@/api/types";

export interface SideBarProps {
	user?: User | null;
	currentProductId?: number;
}

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../Button/Button";
import { InputField } from "@/components/forms/InputField/InputField";
import { FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

interface ShareModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	url: string;
}

export function ShareLink({ open, onOpenChange, url }: ShareModalProps) {
	const copyLink = async () => {
		await navigator.clipboard.writeText(url);

		toast.success("Link copiado para a área de transferência");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Compartilhar</DialogTitle>
				</DialogHeader>

				<div className="flex gap-2">
					<Button
						className="flex gap-2"
						variant="outline"
						onClick={() =>
							window.open(`https://wa.me/?text=${encodeURIComponent(url)}`)
						}
					>
						<span className="block">WhatsApp</span>
						<FaWhatsapp className="text-green-500 text-xl" />
					</Button>

					<Button
						variant="outline"
						onClick={() =>
							window.open(
								`https://twitter.com/intent/tweet?url=${encodeURIComponent(
									url
								)}`
							)
						}
					>
						<FaXTwitter />
					</Button>
				</div>

				<div className="flex gap-2">
					<div className="w-full">
						<InputField value={url} readOnly />
					</div>
					<Button variant="primary" size={"sm"} onClick={copyLink}>
						<Copy size={16} />
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

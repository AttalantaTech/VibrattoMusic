import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../../ui/Button/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Textarea } from "../../ui/Textarea/Textarea";

interface CancelHiringModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (reason: string) => void;
	hiringTitle: string;
	loading?: boolean;
}

export const CancelHiringModal = ({
	isOpen,
	onClose,
	onConfirm,
	hiringTitle,
	loading = false
}: CancelHiringModalProps) => {
	const [reason, setReason] = useState("");

	const handleConfirm = () => {
		if (reason.trim()) {
			onConfirm(reason.trim());
			setReason("");
		}
	};

	const handleClose = () => {
		setReason("");
		onClose();
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 bg-red-100 rounded-full">
							<AlertTriangle className="w-6 h-6 text-red-600" />
						</div>
						<div>
							<DialogTitle className="text-lg font-semibold">
								Cancelar Contratação
							</DialogTitle>
							<p className="text-sm text-gray-600 mt-1">
								{hiringTitle}
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4">
					<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
						<div className="flex items-start gap-3">
							<AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
							<div>
								<p className="text-sm font-medium text-yellow-800">
									Atenção
								</p>
								<p className="text-sm text-yellow-700 mt-1">
									Ao cancelar esta contratação, você poderá perder o valor pago
									até o momento. Esta ação não pode ser desfeita.
								</p>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-gray-700">
							Motivo do cancelamento <span className="text-red-500">*</span>
						</label>
						<Textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Descreva o motivo do cancelamento..."
							rows={4}
							className="resize-none"
						/>
					</div>

					<div className="flex justify-end gap-3 pt-4 border-t">
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={loading}
						>
							Voltar
						</Button>
						<Button
							className="bg-red-600 hover:bg-red-700"
							onClick={handleConfirm}
							disabled={loading || !reason.trim()}
						>
							{loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Palette, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button/Button";
import { useMusicalProductStore } from "@/store/musicalProduct/useMusicalProductStore";
import { shrinkImage } from "@/utils/shrinkImage";
import type { Branding } from "../types";
import { COLOR_PRESETS } from "../utils/schedule";
import { brandingOf, useChecklistStore } from "../hooks/useChecklistStore";

const fieldClass =
	"w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

const asDataUrl = (file: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			resolve(typeof reader.result === "string" ? reader.result : "");
		};
		reader.onerror = () => {
			reject(new Error("Não foi possível ler a imagem"));
		};
		reader.readAsDataURL(file);
	});

/**
 * Checklist > Personalizar PDF: the band's logo, main color and footer
 * contact on every PDF of the checklist. Without a logo the PDF has none
 */
export const ChecklistBrandingTab = () => {
	const { activeProduct } = useMusicalProductStore();
	const profileId = activeProduct?.id ?? 0;
	const byProfile = useChecklistStore((state) => state.byProfile);
	const saveBranding = useChecklistStore((state) => state.saveBranding);
	const saved = brandingOf(byProfile, profileId);

	const [draft, setDraft] = useState<Branding>(saved);
	const [logoError, setLogoError] = useState<string | null>(null);
	const fileRef = useRef<HTMLInputElement>(null);

	// Another profile chosen in the header: its own look
	useEffect(() => {
		setDraft(brandingOf(useChecklistStore.getState().byProfile, profileId));
	}, [profileId]);

	const profileLogo = activeProduct?.logomarca?.trim() || null;
	const logo = profileLogo ?? draft.logo;
	const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

	if (!profileId) return null;

	const pickLogo = async (file: File | undefined) => {
		if (!file) return;
		if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
			setLogoError("Use uma imagem PNG ou JPG.");
			return;
		}
		try {
			// Small enough for the browser's storage while this is a demo
			const data = await asDataUrl(await shrinkImage(file, 600));
			setDraft((current) => ({ ...current, logo: data }));
			setLogoError(null);
		} catch {
			setLogoError("Não foi possível usar essa imagem.");
		}
	};

	const setProducer = (field: keyof Branding["producer"], value: string) => {
		setDraft((current) => ({
			...current,
			producer: { ...current.producer, [field]: value },
		}));
	};

	return (
		<div className="flex w-full flex-col gap-5 pb-10">
			<div>
				<h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
					<Palette className="h-6 w-6 text-primary-700" aria-hidden="true" />
					Personalizar PDF
				</h2>
				<p className="text-sm text-gray-600">
					A cara da sua banda nos PDFs do checklist e do cronograma.
				</p>
			</div>

			<p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
				Versão de demonstração: fica salvo só neste navegador até o servidor
				passar a guardar.
			</p>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
				<div className="flex flex-col gap-6">
					<section className="flex flex-col gap-2">
						<h3 className="text-sm font-semibold text-gray-900">Logo</h3>
						{profileLogo ? (
							<p className="text-sm text-gray-600">
								Usando a logomarca do seu perfil.
							</p>
						) : (
							<>
								{!draft.logo && (
									<p className="text-xs text-gray-500">
										Sem logo, o PDF sai só com o título e o nome da banda.
									</p>
								)}
								<div className="flex gap-2">
									<input
										ref={fileRef}
										type="file"
										accept="image/png,image/jpeg,image/webp"
										className="hidden"
										onChange={(event) => {
											void pickLogo(event.target.files?.[0]);
											event.target.value = "";
										}}
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="flex gap-2"
										onClick={() => fileRef.current?.click()}
									>
										<ImagePlus className="h-4 w-4" aria-hidden="true" />
										{draft.logo ? "Trocar logo" : "Enviar logo"}
									</Button>
									{draft.logo && (
										<Button
											type="button"
											variant="transparent"
											size="sm"
											className="flex gap-2"
											onClick={() => {
												setDraft((current) => ({ ...current, logo: null }));
											}}
										>
											<Trash2 className="h-4 w-4" aria-hidden="true" />
											Remover
										</Button>
									)}
								</div>
							</>
						)}
						{logoError && <p className="text-xs text-red-600">{logoError}</p>}
					</section>

					<section className="flex flex-col gap-2">
						<h3 className="text-sm font-semibold text-gray-900">
							Cor principal
						</h3>
						<div className="flex flex-wrap items-center gap-2">
							{COLOR_PRESETS.map((preset) => (
								<button
									key={preset}
									type="button"
									aria-label={`Cor ${preset}`}
									aria-pressed={draft.color.toUpperCase() === preset}
									className={`h-8 w-8 rounded-full border-2 ${
										draft.color.toUpperCase() === preset
											? "border-gray-900 ring-2 ring-white ring-offset-1"
											: "border-white shadow"
									}`}
									style={{ backgroundColor: preset }}
									onClick={() => {
										setDraft((current) => ({ ...current, color: preset }));
									}}
								/>
							))}
							<label className="flex items-center gap-2 text-xs text-gray-600">
								<input
									type="color"
									aria-label="Outra cor"
									className="h-8 w-10 cursor-pointer rounded border border-gray-300"
									value={draft.color}
									onChange={(event) => {
										setDraft((current) => ({
											...current,
											color: event.target.value.toUpperCase(),
										}));
									}}
								/>
								Outra cor
							</label>
						</div>
					</section>

					<section className="flex flex-col gap-2">
						<h3 className="text-sm font-semibold text-gray-900">
							Contato no rodapé{" "}
							<span className="font-normal text-gray-400">(opcional)</span>
						</h3>
						<input
							aria-label="Nome do produtor"
							placeholder="Produtor ou responsável"
							maxLength={80}
							className={fieldClass}
							value={draft.producer.name}
							onChange={(event) => {
								setProducer("name", event.target.value);
							}}
						/>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<input
								aria-label="E-mail do produtor"
								type="email"
								placeholder="E-mail"
								maxLength={100}
								className={fieldClass}
								value={draft.producer.email}
								onChange={(event) => {
									setProducer("email", event.target.value);
								}}
							/>
							<input
								aria-label="WhatsApp do produtor"
								type="tel"
								placeholder="WhatsApp"
								maxLength={20}
								className={fieldClass}
								value={draft.producer.phone}
								onChange={(event) => {
									setProducer("phone", event.target.value);
								}}
							/>
						</div>
					</section>

					<section className="flex flex-col gap-2">
						<h3 className="text-sm font-semibold text-gray-900">
							Informações importantes padrão{" "}
							<span className="font-normal text-gray-400">(opcional)</span>
						</h3>
						<p className="text-xs text-gray-500">
							Todo evento novo começa com este texto. Ex.: figurino, locadora de
							som, técnico.
						</p>
						<textarea
							aria-label="Informações importantes padrão"
							rows={4}
							maxLength={600}
							placeholder={"Figurino: preto\nTécnico: Lekinho"}
							className={fieldClass}
							value={draft.defaultNotes}
							onChange={(event) => {
								setDraft((current) => ({
									...current,
									defaultNotes: event.target.value,
								}));
							}}
						/>
					</section>
				</div>

				{/* How the top of the PDF looks, always in view on a wide screen */}
				<aside className="lg:sticky lg:top-24 lg:self-start">
					<p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
						Prévia do topo do PDF
					</p>
					<div className="overflow-hidden rounded-md border border-gray-200 bg-white p-4 shadow-sm">
						<div className="flex items-center justify-between gap-3">
							{logo ? (
								<img
									src={logo}
									alt="Logo da banda"
									className="h-10 max-w-[140px] object-contain"
								/>
							) : (
								<span className="text-xs text-gray-400">Sem logo</span>
							)}
							<div className="text-right">
								<p className="text-sm font-bold" style={{ color: draft.color }}>
									CRONOGRAMA - CHECKLIST
								</p>
								<p className="text-xs text-gray-500">{activeProduct?.nome}</p>
							</div>
						</div>
						<div
							className="mt-3 h-1 rounded-full"
							style={{ backgroundColor: draft.color }}
						/>
						<div className="mt-4 grid grid-cols-3 gap-2">
							{["TRANSPORTE", "PÚBLICO", "TIPO"].map((label) => (
								<div
									key={label}
									className="rounded py-2 text-center text-[10px] font-bold"
									style={{
										color: draft.color,
										backgroundColor: `${draft.color}1F`,
									}}
								>
									{label}
								</div>
							))}
						</div>
						{(draft.producer.name ||
							draft.producer.email ||
							draft.producer.phone) && (
							<p className="mt-4 border-t border-gray-100 pt-2 text-center text-[11px] font-semibold text-gray-700">
								{[
									draft.producer.name,
									draft.producer.email,
									draft.producer.phone,
								]
									.filter((part) => part.trim())
									.join("  ·  ")}
							</p>
						)}
					</div>
				</aside>
			</div>

			<div className="flex justify-end gap-2">
				<Button
					type="button"
					variant="secondary"
					size="sm"
					disabled={!isDirty}
					onClick={() => {
						setDraft(saved);
					}}
				>
					Descartar
				</Button>
				<Button
					type="button"
					size="sm"
					disabled={!isDirty}
					onClick={() => {
						saveBranding(profileId, draft);
						toast.success("Personalização do PDF salva");
					}}
				>
					Salvar
				</Button>
			</div>
		</div>
	);
};

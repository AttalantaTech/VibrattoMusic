// Full WhatsApp link of the support team (e.g. https://wa.me/55XXXXXXXXXXX)
export const SUPPORT_WHATSAPP_URL = import.meta.env[
	"VITE_VIBRATTO_SUPPORT_WHATSAPP"
] as string | undefined;

export const openSupportWhatsapp = () => {
	if (!SUPPORT_WHATSAPP_URL) return;
	window.open(SUPPORT_WHATSAPP_URL, "_blank", "noopener,noreferrer");
};

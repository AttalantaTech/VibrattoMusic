import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

const BUTTON_SIZE = 56;
const MARGIN = 16;

type Position = {
	top: number;
	right: number;
};

const WHATSAPP_STORAGE = "whatsapp-button-position";

export function FloatingWhatsApp() {
	const [position, setPosition] = useState<Position | null>(null);

	const isDragging = useRef(false);
	const hasMoved = useRef(false);

	const offset = useRef({
		x: 0,
		y: 0,
	});

	// Posição inicial
	useEffect(() => {
		const saved = localStorage.getItem(WHATSAPP_STORAGE);

		if (saved) {
			try {
				const storageData = localStorage.getItem(WHATSAPP_STORAGE);
				const parsed: Position | null = storageData
					? (JSON.parse(storageData) as Position)
					: null;

				if (!parsed) return;

				setPosition({
					top: Math.max(
						0,
						Math.min(parsed.top, window.innerHeight - BUTTON_SIZE)
					),
					right: Math.max(
						0,
						Math.min(parsed.right, window.innerWidth - BUTTON_SIZE)
					),
				});

				return;
			} catch {
				console.error("Error Position");
			}
		}

		// Inicialmente: canto inferior direito
		setPosition({
			top: window.innerHeight - BUTTON_SIZE - MARGIN,
			right: MARGIN,
		});
	}, []);

	// Corrige a posição ao redimensionar
	useEffect(() => {
		const handleResize = () => {
			setPosition((current) => {
				if (!current) return current;

				const newPosition = {
					top: Math.min(current.top, window.innerHeight - BUTTON_SIZE),
					right: Math.min(current.right, window.innerWidth - BUTTON_SIZE),
				};

				localStorage.setItem(WHATSAPP_STORAGE, JSON.stringify(newPosition));

				return newPosition;
			});
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (!position) return;

		isDragging.current = true;
		hasMoved.current = false;

		const rect = event.currentTarget.getBoundingClientRect();

		offset.current = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};

		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (!isDragging.current) return;

		hasMoved.current = true;

		// Calcula o TOP
		const top = Math.min(
			Math.max(0, event.clientY - offset.current.y),
			window.innerHeight - BUTTON_SIZE
		);

		// Calcula o RIGHT
		const right = Math.min(
			Math.max(
				0,
				window.innerWidth - (event.clientX - offset.current.x) - BUTTON_SIZE
			),
			window.innerWidth - BUTTON_SIZE
		);

		setPosition({
			top,
			right,
		});
	};

	const handlePointerUp = () => {
		if (!isDragging.current) return;

		isDragging.current = false;

		setPosition((current) => {
			if (!current) return current;

			localStorage.setItem(WHATSAPP_STORAGE, JSON.stringify(current));

			return current;
		});
	};

	const handleClick = () => {
		if (hasMoved.current) return;

		const supportWhatsapp = import.meta.env[
			"VITE_VIBRATTO_SUPPORT_WHATSAPP"
		] as string;

		window.open(`${supportWhatsapp}`, "_blank", "noopener,noreferrer");
	};

	if (!position) {
		return null;
	}

	return (
		<button
			type="button"
			aria-label="Abrir WhatsApp"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onClick={handleClick}
			className="
        fixed
        z-50
        flex
        h-14
        w-14
        cursor-grab
        touch-none
        items-center
        justify-center
        rounded-full
        bg-[#25D366]
        text-white
        shadow-lg
        hover:shadow-xl
        active:cursor-grabbing
      "
			style={{
				top: `${position.top}px`,
				right: `${position.right}px`,
			}}
		>
			<FaWhatsapp size={28} />
		</button>
	);
}

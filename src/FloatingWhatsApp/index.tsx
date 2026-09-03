import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

const DRAG_THRESHOLD = 5;
const BUTTON_SIZE = 56;
const MARGIN = 16;

type Position = {
	top: number;
	right: number;
};

const WHATSAPP_STORAGE = "whatsapp-button-position";

export function FloatingWhatsApp() {
	const [position, setPosition] = useState<Position | null>(null);

	const isPointerDown = useRef(false);
	const hasMoved = useRef(false);

	const startPosition = useRef({
		x: 0,
		y: 0,
	});

	const offset = useRef({
		x: 0,
		y: 0,
	});

	// Initial Position
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

		setPosition({
			top: window.innerHeight - BUTTON_SIZE - MARGIN,
			right: MARGIN,
		});
	}, []);

	// Fix Position
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

		isPointerDown.current = true;
		hasMoved.current = false;

		const rect = event.currentTarget.getBoundingClientRect();

		offset.current = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};

		startPosition.current = {
			x: event.clientX,
			y: event.clientY,
		};

		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (!isPointerDown.current) return;

		const deltaX = event.clientX - startPosition.current.x;

		const deltaY = event.clientY - startPosition.current.y;

		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		if (distance < DRAG_THRESHOLD) {
			return;
		}

		hasMoved.current = true;

		const top = Math.min(
			Math.max(0, event.clientY - offset.current.y),
			window.innerHeight - BUTTON_SIZE
		);

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

	const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (!isPointerDown.current) return;

		isPointerDown.current = false;

		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}

		if (hasMoved.current) {
			setPosition((current) => {
				if (!current) return current;

				localStorage.setItem(WHATSAPP_STORAGE, JSON.stringify(current));

				return current;
			});
		}
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
    cursor-pointer
    touch-none
    items-center
    justify-center
    rounded-full
    bg-[#25D366]
    text-white
    shadow-lg
    hover:shadow-xl
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

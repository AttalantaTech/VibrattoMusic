import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

type Position = {
	top: number;
	right: number;
};

const WHATSAPP_STORAGE = "whatsapp-button-position";

export function FloatingWhatsApp() {
	const [position, setPosition] = useState<Position | null>(null);

	const mediaQuery = window.matchMedia("(pointer: coarse)");

	const DRAG_THRESHOLD = 5;
	const BUTTON_HEIGHT = mediaQuery.matches ? 32 : 48;
	const BUTTON_WIDTH = mediaQuery.matches ? 115 : 161;
	const MARGIN = 16;

	const isPointerDown = useRef(false);
	const hasMoved = useRef(false);

	const startPosition = useRef({ x: 0, y: 0 });
	const offset = useRef({ x: 0, y: 0 });

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
						Math.min(parsed.top, window.innerHeight - BUTTON_HEIGHT)
					),
					right: Math.max(
						0,
						Math.min(parsed.right, window.innerWidth - BUTTON_WIDTH)
					),
				});

				return;
			} catch {
				console.error("Error Position");
			}
		}

		setPosition({
			top: window.innerHeight - BUTTON_HEIGHT - MARGIN,
			right: MARGIN,
		});
	}, [BUTTON_HEIGHT, BUTTON_WIDTH]);

	// Fix Position
	useEffect(() => {
		const handleResize = () => {
			setPosition((current) => {
				if (!current) return current;

				const newPosition = {
					top: Math.min(current.top, window.innerHeight - BUTTON_HEIGHT),
					right: Math.min(current.right, window.innerWidth - BUTTON_WIDTH),
				};

				localStorage.setItem(WHATSAPP_STORAGE, JSON.stringify(newPosition));

				return newPosition;
			});
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [BUTTON_HEIGHT, BUTTON_WIDTH]);

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
			window.innerHeight - BUTTON_HEIGHT
		);

		const right = Math.min(
			Math.max(
				0,
				window.innerWidth - (event.clientX - offset.current.x) - BUTTON_WIDTH
			),
			window.innerWidth - BUTTON_WIDTH
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
			aria-label="Fale conosco pelo Whatsapp"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onClick={handleClick}
			className={`
        fixed
        z-50
        flex
        w-auto
        select-none
        p-1
        cursor-pointer
        touch-none
        items-center
        justify-center
        rounded-full
        bg-[#25D366]
        text-white
        shadow-lg
        hover:shadow-xl
        active:scale-95
        transition-transform
			`}
			style={{
				top: `${position.top}px`,
				right: `${position.right}px`,
				height: `${BUTTON_HEIGHT}px`,
			}}
		>
			<div
				className="flex items-center justify-center rounded-full bg-white shadow-md flex-shrink-0"
				style={{
					height: mediaQuery.matches ? "1.5rem" : "2.5rem",
					width: mediaQuery.matches ? "1.5rem" : "2.5rem",
				}}
			>
				<FaWhatsapp
					style={{ fontSize: mediaQuery.matches ? "1.5rem" : "2.5rem" }}
					className="text-[#25D366]"
				/>
			</div>
			<div
				className="ml-2.5 flex flex-col items-start leading-tight pr-3 font-bold text-xs tracking-tight uppercase whitespace-nowrap"
				style={{ fontSize: mediaQuery.matches ? "0.5rem" : "0.75rem" }}
			>
				<span>Fale Conosco</span>
			</div>
		</button>
	);
}

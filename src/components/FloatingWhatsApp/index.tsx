import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useRouterState, type AnyRouter } from "@tanstack/react-router";
import { openSupportWhatsapp } from "@/utils/support";

type Position = {
	top: number;
	right: number;
};

const WHATSAPP_STORAGE = "whatsapp-button-position";

// Rendered outside RouterProvider (App.tsx), so it gets the router as a prop
export function FloatingWhatsApp({ router }: { router: AnyRouter }) {
	const [position, setPosition] = useState<Position | null>(null);

	// The chat already is a contact channel, and on phones the button sat
	// right over its send button. "messages" is also the default tab
	const isOnMessages = useRouterState({
		router,
		select: (state) =>
			state.location.pathname === "/band/me" &&
			((state.location.search as { tab?: string }).tab ?? "messages") ===
				"messages",
	});

	// Public profile below lg has a fixed action bar at the bottom (80px with
	// the iPhone home indicator): the button stays above it instead of on it
	const isOnPublicProfile = useRouterState({
		router,
		select: (state) => state.location.pathname.startsWith("/band/profile/"),
	});
	const reservedBottom = isOnPublicProfile && window.innerWidth < 1024 ? 80 : 0;

	// Touch screens and phone-width windows get a 48px round icon-only button:
	// the "Fale conosco" pill shrank its text to 8px there and covered page
	// content. The width check covers browsers that don't report the touch
	// screen (some Android tablets, in-app browsers)
	const isCompact =
		window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 640;

	const DRAG_THRESHOLD = 5;
	const BUTTON_HEIGHT = 48;
	const BUTTON_WIDTH = isCompact ? 48 : 161;
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

		openSupportWhatsapp();
	};

	if (!position || (isCompact && isOnMessages)) {
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
			// z-40: modals and full-screen editors (z-50) cover it instead of it
			// sitting on their buttons; same layer as the profile action bar
			className={`
        fixed
        z-40
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
				top: `${Math.max(
					0,
					Math.min(
						position.top,
						window.innerHeight - BUTTON_HEIGHT - MARGIN - reservedBottom
					)
				)}px`,
				right: `${position.right}px`,
				height: `${BUTTON_HEIGHT}px`,
				width: isCompact ? `${BUTTON_WIDTH}px` : undefined,
			}}
		>
			{isCompact ? (
				<FaWhatsapp className="text-[1.75rem]" aria-hidden="true" />
			) : (
				<>
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md flex-shrink-0">
						<FaWhatsapp className="text-[2.5rem] text-[#25D366]" />
					</div>
					<div className="ml-2.5 flex flex-col items-start leading-tight pr-3 font-bold text-xs tracking-tight uppercase whitespace-nowrap">
						<span>Fale Conosco</span>
					</div>
				</>
			)}
		</button>
	);
}

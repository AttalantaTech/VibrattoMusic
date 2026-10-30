import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useRouterState, type AnyRouter } from "@tanstack/react-router";
import { openSupportWhatsapp } from "@/utils/support";

// Distance from the bottom-right corner: when the phone keyboard or the
// address bar shrinks the screen, the button keeps its place relative to the
// bottom instead of being pushed up for good
type Position = {
	bottom: number;
	right: number;
};

// v2: the old key stored `top`, which hid the button behind the header for
// some users; they get the default spot back
const WHATSAPP_STORAGE = "whatsapp-button-position-v2";
const LEGACY_WHATSAPP_STORAGE = "whatsapp-button-position";

const DRAG_THRESHOLD = 5;
const BUTTON_HEIGHT = 48;
const MARGIN = 16;
// The fixed header (64px, z-50) covers anything above this line
const HEADER_SPACE = 64 + 8;

const readSavedPosition = (): Position | null => {
	try {
		localStorage.removeItem(LEGACY_WHATSAPP_STORAGE);
		const saved = localStorage.getItem(WHATSAPP_STORAGE);
		if (!saved) return null;
		const parsed = JSON.parse(saved) as Partial<Position>;
		return typeof parsed.bottom === "number" && typeof parsed.right === "number"
			? { bottom: parsed.bottom, right: parsed.right }
			: null;
	} catch {
		return null;
	}
};

// Rendered outside RouterProvider (App.tsx), so it gets the router as a prop
export function FloatingWhatsApp({ router }: { router: AnyRouter }) {
	const [position, setPosition] = useState<Position>(
		() => readSavedPosition() ?? { bottom: MARGIN, right: MARGIN }
	);
	// Re-render on resize so the limits below follow the screen; the saved
	// position itself only changes when the user drags the button
	const [, setViewport] = useState({
		width: window.innerWidth,
		height: window.innerHeight,
	});

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

	const BUTTON_WIDTH = isCompact ? 48 : 161;

	// Always on screen, between the header and the bottom (or the action bar).
	// Dragging it up while scrolling used to park it behind the header, saved
	const clampBottom = (bottom: number) =>
		Math.max(
			MARGIN + reservedBottom,
			Math.min(bottom, window.innerHeight - BUTTON_HEIGHT - HEADER_SPACE)
		);
	const clampRight = (right: number) =>
		Math.max(0, Math.min(right, window.innerWidth - BUTTON_WIDTH));

	const isPointerDown = useRef(false);
	const hasMoved = useRef(false);

	const startPosition = useRef({ x: 0, y: 0 });
	const offset = useRef({ x: 0, y: 0 });

	useEffect(() => {
		const handleResize = () => {
			setViewport({ width: window.innerWidth, height: window.innerHeight });
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
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

		const top = event.clientY - offset.current.y;
		const left = event.clientX - offset.current.x;

		setPosition({
			bottom: clampBottom(window.innerHeight - top - BUTTON_HEIGHT),
			right: clampRight(window.innerWidth - left - BUTTON_WIDTH),
		});
	};

	const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (!isPointerDown.current) return;

		isPointerDown.current = false;

		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}

		if (hasMoved.current) {
			try {
				localStorage.setItem(WHATSAPP_STORAGE, JSON.stringify(position));
			} catch {
				// Private mode: the position just isn't remembered
			}
		}
	};

	const handleClick = () => {
		if (hasMoved.current) return;

		openSupportWhatsapp();
	};

	if (isCompact && isOnMessages) {
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
				bottom: `${clampBottom(position.bottom)}px`,
				right: `${clampRight(position.right)}px`,
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

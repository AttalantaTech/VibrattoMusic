import { createContext } from "react";
import type { MessagesContextType } from "./types";

export const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

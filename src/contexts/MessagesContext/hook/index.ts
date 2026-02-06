import { useContext } from "react";
import { MessagesContext } from "..";

export const useMessagesContext = () => useContext(MessagesContext);

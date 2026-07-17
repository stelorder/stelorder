import { createContext } from "react";

export interface RootContextType {
    root: HTMLElement;
}

export const RootContext = createContext<RootContextType | null>(null);
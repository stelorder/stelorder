import { ComponentPropsWithoutRef, ElementType, default as React } from 'react';
export type ListVariant = "default" | "outlined" | "ghost";
export type ListDensity = "compact" | "comfortable" | "spacious";
export interface ListProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
    title?: React.ReactNode;
    containerElement?: ElementType;
    dividers?: boolean;
    variant?: ListVariant;
    density?: ListDensity;
    maxHeight?: number | string;
    scrollable?: boolean;
}

import { PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
export type BadgeType = "info" | "success" | "warning" | "error" | "highlight";
export type BadgeProps = {
    variant?: BadgeType;
};
declare function Badge({ variant, children, htmlProps, }: BadgeProps & PropsWithChildren<HtmlProps<HTMLDivElement>>): import("react/jsx-runtime").JSX.Element;
export default Badge;

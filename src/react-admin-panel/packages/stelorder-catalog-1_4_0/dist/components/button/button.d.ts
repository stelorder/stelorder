import { PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
export type ButtonVariant = "primary" | "secondary" | "gray" | "white" | "whiteOutlineFree" | "grayOutlineFree" | "lite" | "disabled";
export type ButtonSize = "xl" | "m" | "l";
export type ButtonProps = {
    variant?: ButtonVariant;
    size?: ButtonSize;
};
export default function Button({ children, htmlProps, ...props }: ButtonProps & PropsWithChildren<HtmlProps<HTMLButtonElement>>): import("react/jsx-runtime").JSX.Element;

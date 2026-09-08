import { PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
export type AlertVariant = "error" | "warning" | undefined;
export type AlertProps = {
    variant?: AlertVariant;
    showCloseButton?: boolean;
    showIcon?: boolean;
    onClose?: () => void;
    closeAriaLabel?: string;
};
declare function Alert({ variant, showCloseButton, showIcon, onClose, closeAriaLabel, children, htmlProps, }: AlertProps & PropsWithChildren<HtmlProps<HTMLDivElement>>): import("react/jsx-runtime").JSX.Element;
export default Alert;

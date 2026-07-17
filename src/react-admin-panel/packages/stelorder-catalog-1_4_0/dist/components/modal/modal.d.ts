import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
import { IconVariant } from '../icon/icon-constants';
export type ModalLayout = "default" | "centered" | "none";
export type ModalProps = {
    isOpen: boolean;
    isCentered?: boolean;
    animationDurationSec?: number;
    fade?: boolean;
    showIn?: HTMLElement | null;
    icon?: IconVariant;
    showCloseButton?: boolean;
    onClose?: () => void;
    layout?: ModalLayout;
};
declare const Modal: React.FC<PropsWithChildren<ModalProps & HtmlProps<HTMLDivElement>>>;
export default Modal;

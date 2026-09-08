import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
export type LoadingModalProps = {
    isOpen: boolean;
    isCentered?: boolean;
    animationDurationSec?: number;
    fade?: boolean;
    showIn?: HTMLElement | null;
};
declare const LoadingModal: React.FC<PropsWithChildren<LoadingModalProps & HtmlProps<HTMLDivElement>>>;
export default LoadingModal;

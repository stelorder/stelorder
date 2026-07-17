import { default as React, PropsWithChildren, ReactElement } from 'react';
import { HtmlProps } from '../styles/theme';
export type TooltipAlignMessage = "left" | "middle" | "right";
export type TooltipProps = {
    onHoverDisplay?: boolean;
    alignMessage?: TooltipAlignMessage;
    message: ReactElement | string;
    showIn?: HTMLDivElement | null;
};
declare const Tooltip: React.FC<PropsWithChildren<TooltipProps & HtmlProps<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
}>>;
export default Tooltip;

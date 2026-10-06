import { TooltipAlignMessage } from './tooltip';
import { StyledProp } from '../styles/theme';
import { default as React, HTMLAttributes, PropsWithChildren } from 'react';
export declare const StyledTooltipContainer: React.FC<PropsWithChildren<React.DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & StyledProp<{
    onHoverDisplay: boolean;
    alignMessage: TooltipAlignMessage;
    isFloat: boolean;
    showIn?: HTMLDivElement | null;
}>> & {
    tooltipRef: React.RefObject<HTMLDivElement | null>;
}>;
export declare const StyledTooltipMessage: import('styled-components/dist/types').IStyledComponentBase<"web", Omit<import('styled-components/dist/types').Merged<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "style"> & {
    style?: React.CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, StyledProp<{
    alignMessage: TooltipAlignMessage;
    notFloat: boolean;
}>>, "className"> & Partial<Pick<import('styled-components/dist/types').Merged<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "style"> & {
    style?: React.CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, StyledProp<{
    alignMessage: TooltipAlignMessage;
    notFloat: boolean;
}>>, "className">>> & string;

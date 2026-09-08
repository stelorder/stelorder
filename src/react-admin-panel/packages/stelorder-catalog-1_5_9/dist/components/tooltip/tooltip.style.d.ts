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
export declare const StyledTooltipMessage: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('styled-components').FastOmit<import('styled-components/dist/types').Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>, never>, StyledProp<{
    alignMessage: TooltipAlignMessage;
    notFloat: boolean;
}>>> & string;

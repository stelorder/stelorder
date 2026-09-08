import { default as React, HTMLAttributes } from 'react';
import { StyledProp } from '../../styles/theme';
export declare const StyledNormalControl: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components').FastOmit<import('styled-components').FastOmit<import('styled-components/dist/types').Substitute<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>>, never>, never>> & string;
export declare const StyledCurrentPageControl: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components').FastOmit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, never>> & string;
export declare const StyledArrowControl: React.FC<StyledProp<{
    type: "prev" | "next";
}> & HTMLAttributes<SVGElement>>;

import { SimpleGridItemProps } from './simple-grid-item';
import { StyledProp } from '../../styles/theme';
import { default as React } from 'react';
type StyleSimpleGridItemProps = {
    total: number;
    gap: number;
    col: number | "auto";
    ref: React.RefObject<HTMLDivElement | null>;
} & SimpleGridItemProps;
export declare const StyledSimpleGridItem: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('styled-components/dist/types').Substitute<import('styled-components/dist/types').Substitute<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>, StyledProp<StyleSimpleGridItemProps>>, StyledProp<StyleSimpleGridItemProps>>> & string;
export {};

import { GridAlign, SimpleGridProps } from './simple-grid';
import { StyledProp } from '../styles/theme';
type StyledSimpleGridProps = SimpleGridProps & {
    itemsPerLine: number;
    alignX?: GridAlign;
    alignY?: GridAlign;
};
export declare const StyledSimpleGrid: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, StyledProp<StyledSimpleGridProps>>> & string;
export {};

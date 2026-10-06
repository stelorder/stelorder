import { GridAlign, SimpleGridProps } from './simple-grid';
import { StyledProp } from '../styles/theme';
type StyledSimpleGridProps = SimpleGridProps & {
    itemsPerLine: number;
    alignX?: GridAlign;
    alignY?: GridAlign;
};
export declare const StyledSimpleGrid: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, StyledProp<StyledSimpleGridProps>>> & string;
export {};

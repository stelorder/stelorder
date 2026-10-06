import { StyledProp } from '../styles/theme';
import { StrokeLinecap, StrokeLinejoin } from './icon-constants';
export type SizePx = string;
export declare const StyledIcon: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').SVGProps<SVGSVGElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, StyledProp<{
    width?: SizePx;
    height?: SizePx;
    color?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: StrokeLinecap;
    strokeLinejoin?: StrokeLinejoin;
}>>> & string;

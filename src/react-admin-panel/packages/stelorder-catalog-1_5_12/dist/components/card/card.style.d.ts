import { TextAlign } from './card';
import { StyledProp } from '../styles/theme';
type StyledCardProps = {
    text: TextAlign;
};
export declare const StyledCard: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, StyledProp<StyledCardProps & import('./card').CardBasicsProps & import('./card').CardResponsiveProps>>> & string;
export {};

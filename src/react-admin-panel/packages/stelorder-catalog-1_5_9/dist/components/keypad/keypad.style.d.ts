import { StyledProp } from '../styles/theme';
import { KeypadKeyVariant, KeypadSize } from './keypad';
export declare const StyledKeypad: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, StyledProp<{
    columns: number;
    size: KeypadSize;
}>>> & string;
export declare const StyledKey: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, StyledProp<{
    size: KeypadSize;
    variant: KeypadKeyVariant;
    colSpan?: number;
}>>> & string;

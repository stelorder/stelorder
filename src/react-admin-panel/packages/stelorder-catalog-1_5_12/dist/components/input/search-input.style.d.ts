import { SearchInputSize, SearchInputVariant } from './search-input';
import { StyledProp } from '../styles/theme';
/** Caja que agrupa el adorno y el campo cuando se pasa `startAdornment`. */
export declare const StyledSearchInputShell: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, StyledProp<{
    size: SearchInputSize;
    variant: SearchInputVariant;
    fluid: boolean;
}>>> & string;
export declare const StyledSearchInput: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').DetailedHTMLProps<import('react').InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, StyledProp<{
    size: SearchInputSize;
    variant: SearchInputVariant;
    fluid: boolean;
    inShell: boolean;
}>>> & string;

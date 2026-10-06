import { StyledProp } from '../../styles/theme';
import { ValidatingState } from '../form-types';
export type SelectSize = "md" | "lg";
export declare const Container: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, StyledProp<{
    state: ValidatingState;
    isOpen?: boolean;
    size?: SelectSize;
}>>> & string;
export declare const HiddenInput: import('styled-components/dist/types').IStyledComponentBase<"web", Omit<import('react').DetailedHTMLProps<import('react').InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}> & string;
export declare const NoResults: import('styled-components/dist/types').IStyledComponentBase<"web", Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}> & string;

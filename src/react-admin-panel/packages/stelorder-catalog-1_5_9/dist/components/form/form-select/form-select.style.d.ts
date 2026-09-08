import { StyledProp } from '../../styles/theme';
import { ValidatingState } from '../form-types';
export type SelectSize = "md" | "lg";
export declare const Container: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, StyledProp<{
    state: ValidatingState;
    isOpen?: boolean;
    size?: SelectSize;
}>>> & string;
export declare const HiddenInput: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components').FastOmit<import('react').DetailedHTMLProps<import('react').InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, never>> & string;
export declare const NoResults: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components').FastOmit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, never>> & string;

import { StyledProp } from '../../styles/theme';
import { ValidatingState } from '../form-types';
export declare const StyledInput: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components').FastOmit<import('react').DetailedHTMLProps<import('react').InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, never>> & string;
type StyledIconProps = StyledProp<{
    state: "valid" | "invalid" | "default" | undefined;
    visible?: boolean;
    formValidable?: boolean;
}>;
export declare const StyledIcon: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('styled-components/dist/types').Substitute<import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>, import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>>, StyledIconProps>, StyledIconProps>> & string;
export declare const StyledControlFlex: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, StyledProp<{
    state?: ValidatingState;
}>>> & string;
export declare const StyledControl: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components').FastOmit<import('react').DetailedHTMLProps<import('react').InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, never>> & string;
export {};

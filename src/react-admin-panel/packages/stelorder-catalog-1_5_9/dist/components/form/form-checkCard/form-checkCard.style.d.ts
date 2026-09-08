import { StyledProp } from '../../styles/theme';
export type FormCheckCardVariant = "radio" | "boolean" | "compact";
type FormCheckCardStyledProps = StyledProp<{
    variant: FormCheckCardVariant;
}>;
export declare const StyledFormCheckCard: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>, FormCheckCardStyledProps>> & string;
export declare const StyledFormCheckCardHeader: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components').FastOmit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, never>> & string;
export declare const StyledFormCheckCardBody: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, FormCheckCardStyledProps>> & string;
export {};

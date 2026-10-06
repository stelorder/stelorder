import { StyledProp } from '../../styles/theme';
export type FormCheckCardVariant = "radio" | "boolean" | "compact";
type FormCheckCardStyledProps = StyledProp<{
    variant: FormCheckCardVariant;
}>;
export declare const StyledFormCheckCard: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').DetailedHTMLProps<import('react').LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, FormCheckCardStyledProps>> & string;
export declare const StyledFormCheckCardHeader: import('styled-components/dist/types').IStyledComponentBase<"web", Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}> & string;
export declare const StyledFormCheckCardBody: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, FormCheckCardStyledProps>> & string;
export {};

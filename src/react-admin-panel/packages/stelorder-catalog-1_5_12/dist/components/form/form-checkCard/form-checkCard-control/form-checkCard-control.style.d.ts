import { StyledProp } from '../../../styles/theme';
import { FormCheckCardVariant } from '../form-checkCard.style';
type ControlStyledProps = StyledProp<{
    variant: FormCheckCardVariant;
}>;
export declare const StyledFormCheckCardControl: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').DetailedHTMLProps<import('react').InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, ControlStyledProps>> & string;
export {};

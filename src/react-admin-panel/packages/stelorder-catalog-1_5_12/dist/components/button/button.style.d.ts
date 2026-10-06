import { ButtonSize, ButtonVariant } from './button';
import { StyledProp } from '../styles/theme';
export declare const StyledButton: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Merged<Omit<import('react').DetailedHTMLProps<import('react').ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, "style"> & {
    style?: import('react').CSSProperties | import('styled-components/dist/types').CSSPropertiesWithVars | undefined;
}, StyledProp<{
    variant: ButtonVariant;
    size: ButtonSize;
}>>> & string;

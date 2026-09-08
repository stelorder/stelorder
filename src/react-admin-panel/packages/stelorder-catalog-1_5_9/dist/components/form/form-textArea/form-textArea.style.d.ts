import { StyledProp } from '../../styles/theme';
import { ValidatingState } from '../form-types';
import { TextAreaStyles, TextAreaVariant } from './form-textArea-types';
export declare const StyledTextArea: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, StyledProp<{
    state: ValidatingState;
    variant: TextAreaVariant;
    autoResize: boolean;
    width?: string;
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    styles?: TextAreaStyles;
    disabled: boolean;
}>>> & string;

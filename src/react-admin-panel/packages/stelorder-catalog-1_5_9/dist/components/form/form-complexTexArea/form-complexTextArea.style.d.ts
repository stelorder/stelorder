import { StyledProp } from '../../styles/theme';
import { ValidatingState } from '../form-types';
import { TextAreaVariant } from '../form-textArea/form-textArea-types';
import { ComplexTextAreaStyles } from './form-complexTexArea-types';
type WrapperStyled = {
    state: ValidatingState;
    width?: string;
    isFocused: boolean;
    columnGap?: string;
    styles?: ComplexTextAreaStyles;
};
type CellStyled = {
    minHeight?: string;
    maxHeight?: string;
    textAreaVariant: TextAreaVariant;
    styles?: ComplexTextAreaStyles;
};
export declare const StyledComplexTextAreaWrapper: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, StyledProp<WrapperStyled>>> & string;
export declare const StyledMiddleRow: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, StyledProp<{
    hasLeft: boolean;
    hasRight: boolean;
    columnGap?: string;
}>>> & string;
export declare const StyledTextAreaCell: import('styled-components/dist/types').IStyledComponentBase<"web", import('styled-components/dist/types').Substitute<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, StyledProp<CellStyled>>> & string;
export {};

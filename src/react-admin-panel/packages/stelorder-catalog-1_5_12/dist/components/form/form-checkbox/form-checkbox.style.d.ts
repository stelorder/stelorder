import { StyledProp } from '../../styles/theme';
import { default as React } from 'react';
import { AlignLabel, SwitchVariant, ValidatingState } from '../form-types';
type StyledFormCheckboxType = StyledProp<{
    state?: ValidatingState;
    type?: "checkbox" | "radio" | SwitchVariant;
    label?: string;
    labelPosition: AlignLabel;
    labelGap: number;
}>;
export declare const StyledFormCheckbox: ({ $styled: { type, state, labelPosition, label, labelGap, }, ...htmlProps }: StyledFormCheckboxType) => React.JSX.Element;
export {};

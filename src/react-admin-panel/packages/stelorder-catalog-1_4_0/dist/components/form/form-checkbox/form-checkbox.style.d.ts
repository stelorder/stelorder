import { StyledProp } from '../../styles/theme';
import { AlignLabel, ValidatingState } from '../form-types';
type StyledFormCheckboxType = StyledProp<{
    state?: ValidatingState;
    type?: "checkbox" | "radio" | "switch";
    label?: string;
    labelPosition: AlignLabel;
    labelGap: number;
}>;
export declare const StyledFormCheckbox: ({ $styled: { type, state, labelPosition, label, labelGap, }, ...htmlProps }: StyledFormCheckboxType) => import("react/jsx-runtime").JSX.Element;
export {};

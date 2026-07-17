import { default as React, PropsWithChildren } from 'react';
import { AlignLabel, CommonProps } from '../form-types';
import { HtmlProps } from '../../styles/theme';
export type FormCheckboxProps = PropsWithChildren<{
    label?: string;
    id: string;
    type?: "checkbox" | "radio" | "switch";
    labelPosition?: AlignLabel;
    labelGap?: number;
} & CommonProps & HtmlProps<HTMLInputElement>>;
declare const FormCheckbox: React.FC<FormCheckboxProps>;
export default FormCheckbox;

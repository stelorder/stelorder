import { default as React } from 'react';
import { HtmlProps } from '../../styles/theme';
import { CommonProps } from '../form-types';
export type FormColorVariant = "dot" | "input";
export type FormColorProps = {
    variant?: FormColorVariant;
    value?: string;
    dotSize?: number;
    borderRadius?: string;
    ariaLabel?: string;
} & CommonProps & HtmlProps<HTMLInputElement>;
declare const FormColor: React.FC<FormColorProps>;
export default FormColor;

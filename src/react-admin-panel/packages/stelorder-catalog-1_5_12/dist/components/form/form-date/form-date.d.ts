import { default as React } from 'react';
import { HtmlProps } from '../../styles/theme';
import { CommonProps } from '../form-types';
import { FormDateLocale } from './form-date-types';
export type { FormDateLocale };
export type FormDateProps = {
    value?: string | string[];
    multiple?: boolean;
    placeholder?: string;
    locale?: FormDateLocale;
    minDate?: string;
    maxDate?: string;
    disabledDates?: string[];
    boxPosition?: "top" | "bottom";
    showTime?: boolean;
    onDateChange?: (value: string | string[]) => void;
} & CommonProps & HtmlProps<HTMLInputElement>;
declare const FormDate: React.FC<FormDateProps>;
export default FormDate;

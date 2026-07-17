import { default as React, PropsWithChildren } from 'react';
import { CommonProps } from '../form-types';
import { HtmlProps } from '../../styles/theme';
export type FormControlProps = PropsWithChildren<CommonProps & HtmlProps<HTMLInputElement | HTMLTextAreaElement>> & ({
    as?: "input";
} | {
    as?: "textarea";
});
declare const FormControl: React.FC<FormControlProps>;
export default FormControl;

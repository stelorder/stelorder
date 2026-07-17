import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../../styles/theme';
export type FormLabelProps = {
    htmlFor?: string;
};
declare const FormLabel: React.FC<PropsWithChildren<FormLabelProps & HtmlProps<HTMLLabelElement>>>;
export default FormLabel;

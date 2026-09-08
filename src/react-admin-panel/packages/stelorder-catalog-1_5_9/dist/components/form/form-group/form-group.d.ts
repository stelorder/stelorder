import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../../styles/theme';
export type FormGroupProps = {
    controlId?: string;
};
declare const FormGroup: React.FC<PropsWithChildren<FormGroupProps & HtmlProps<HTMLDivElement>>>;
export default FormGroup;

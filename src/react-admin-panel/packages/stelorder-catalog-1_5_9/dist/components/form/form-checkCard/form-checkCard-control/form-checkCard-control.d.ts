import { default as React } from 'react';
import { HtmlProps } from '../../../styles/theme';
import { FormCheckCardVariant } from '../form-checkCard.style';
export type FormCheckCardControlProps = {
    variant: FormCheckCardVariant;
    disabled?: boolean;
} & HtmlProps<HTMLInputElement>;
declare const FormCheckCardControl: React.FC<FormCheckCardControlProps>;
export default FormCheckCardControl;

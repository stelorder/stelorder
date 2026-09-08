import { PropsWithChildren } from 'react';
import { FormCheckCardVariant } from './form-checkCard.style';
import { HtmlProps } from '../../styles/theme';
import { default as FormCheckCardControl } from './form-checkCard-control/form-checkCard-control';
import { default as FormCheckCardLabel } from './form-checkCard-label/form-checkCard-label';
import { default as FormCheckCardDescription } from './form-checkCard-description/form-checkCard-description';
import { default as FormCheckCardStatus } from './form-checkCard-status/form-checkCard-status';
export type FormCheckCardProps = PropsWithChildren<{
    variant?: FormCheckCardVariant;
    disabled?: boolean;
} & HtmlProps<HTMLInputElement>>;
declare function FormCheckCardBase({ variant, disabled, htmlProps, children, }: FormCheckCardProps): import("react/jsx-runtime").JSX.Element;
type FormCheckCardComponent = typeof FormCheckCardBase & {
    Control: typeof FormCheckCardControl;
    Label: typeof FormCheckCardLabel;
    Description: typeof FormCheckCardDescription;
    Status: typeof FormCheckCardStatus;
};
declare const FormCheckCard: FormCheckCardComponent;
export default FormCheckCard;

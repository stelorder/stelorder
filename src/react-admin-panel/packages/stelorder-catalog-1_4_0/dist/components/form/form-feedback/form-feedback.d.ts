import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../../styles/theme';
export type FormFeedbackProps = {
    name?: string;
    type?: "invalid" | "valid" | undefined;
};
declare const FormFeedback: React.FC<PropsWithChildren<FormFeedbackProps & HtmlProps<HTMLElement>>>;
export default FormFeedback;

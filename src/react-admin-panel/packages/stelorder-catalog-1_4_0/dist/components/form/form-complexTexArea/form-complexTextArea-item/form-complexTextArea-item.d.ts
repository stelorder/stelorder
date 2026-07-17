import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../../../styles/theme';
export type FormComplexTextAreaItemPosition = "top" | "bottom" | "left" | "right";
export type FormComplexTextAreaItemProps = PropsWithChildren<HtmlProps<HTMLDivElement> & {
    position: FormComplexTextAreaItemPosition;
}>;
declare const FormComplexTextAreaItem: React.FC<FormComplexTextAreaItemProps>;
export default FormComplexTextAreaItem;

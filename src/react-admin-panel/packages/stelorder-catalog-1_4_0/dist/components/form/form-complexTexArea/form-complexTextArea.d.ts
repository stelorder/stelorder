import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../../styles/theme';
import { ComplexTextAreaStyles } from './form-complexTexArea-types';
import { default as FormComplexTextAreaItem } from './form-complexTextArea-item/form-complexTextArea-item';
import { TextAreaVariant } from '../form-textArea/form-textArea-types';
export type FormComplexTextAreaProps = PropsWithChildren<{
    isValid?: boolean;
    isInvalid?: boolean;
    width?: string;
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    styles?: ComplexTextAreaStyles;
    columnGap?: string;
    disabled?: boolean;
    placeholder?: string;
    name?: string;
    value?: string;
    onChange?: (value: string) => void;
    textAreaVariant?: TextAreaVariant;
    textAreaHtmlProps?: HtmlProps<HTMLDivElement>["htmlProps"];
}>;
declare const FormComplexTextAreaBase: React.FC<FormComplexTextAreaProps & HtmlProps<HTMLDivElement>>;
type FormComplexTextAreaComponent = typeof FormComplexTextAreaBase & {
    Item: typeof FormComplexTextAreaItem;
};
declare const FormComplexTextArea: FormComplexTextAreaComponent;
export default FormComplexTextArea;

import { PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
import { default as FormGroup } from './form-group/form-group';
import { default as FormLabel } from './form-label/form-label';
import { default as FormControl } from './form-control/form-control';
import { default as FormFeedback } from './form-feedback/form-feedback';
import { default as FormCheckbox } from './form-checkbox/form-checkbox';
import { default as FormSelect } from './form-select/form-select';
import { default as FormTextArea } from './form-textArea/form-textArea';
import { default as FormComplexTextArea } from './form-complexTexArea/form-complexTextArea';
import { default as FormColor } from './form-color/form-color';
export type FormProps = {
    validated?: boolean;
    notHandleValidation?: boolean;
};
declare function FormBase({ children, validated, notHandleValidation, htmlProps, }: PropsWithChildren<FormProps & HtmlProps<HTMLFormElement>>): import("react/jsx-runtime").JSX.Element;
type FormComponent = typeof FormBase & {
    Group: typeof FormGroup;
    Label: typeof FormLabel;
    Control: typeof FormControl;
    Feedback: typeof FormFeedback;
    Checkbox: typeof FormCheckbox;
    Select: typeof FormSelect;
    TextArea: typeof FormTextArea;
    ComplexTextArea: typeof FormComplexTextArea;
    Color: typeof FormColor;
};
declare const Form: FormComponent;
export default Form;

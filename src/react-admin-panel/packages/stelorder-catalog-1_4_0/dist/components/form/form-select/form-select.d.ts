import { default as React } from 'react';
import { SelectOption } from './form-select-types';
import { HtmlProps } from '../../styles/theme';
declare const FormSelect: React.FC<{
    options: SelectOption[];
    optionValue?: SelectOption;
    defaultOption?: SelectOption;
    handleChange: (option: SelectOption) => void;
    isValid?: boolean;
    isInvalid?: boolean;
    boxPosition?: "top" | "bottom";
} & HtmlProps<HTMLInputElement>>;
export default FormSelect;

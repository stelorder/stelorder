import { default as React } from 'react';
import { SelectOption } from './form-select-types';
import { HtmlProps } from '../../styles/theme';
import { FormSelectList } from './form-select-list/form-select-list';
import { FormSelectItem } from './form-select-item/form-select-item';
declare const FormSelectBase: React.FC<{
    options?: SelectOption[];
    optionValue?: SelectOption;
    defaultOption?: SelectOption;
    handleChange: (option: SelectOption) => void;
    isValid?: boolean;
    isInvalid?: boolean;
    size?: "md" | "lg";
    boxPosition?: "top" | "bottom";
    scrollable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
    noResultsLabel?: string;
    noResultsNode?: React.ReactNode;
    placeholderSearch?: string;
    dropdownMaxWidth?: string;
    children?: React.ReactNode;
} & HtmlProps<HTMLInputElement>>;
type FormSelectType = typeof FormSelectBase & {
    List: typeof FormSelectList;
    Item: typeof FormSelectItem;
};
declare const FormSelect: FormSelectType;
export default FormSelect;

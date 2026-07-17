import { default as React } from 'react';
import { SelectOption } from './form-select-types';
import { ValidatingState } from '../form-types';
export declare const StyledSelectComponent: React.FC<{
    isOpen: boolean;
    toggleOpen: () => void;
    closeOpen: () => void;
    selectOption: (option: SelectOption) => void;
    options: SelectOption[];
    selectedOption?: SelectOption;
    defaultOption?: SelectOption;
    htmlProps?: React.HTMLProps<HTMLInputElement>;
    state: ValidatingState;
    boxPosition?: "top" | "bottom";
}>;

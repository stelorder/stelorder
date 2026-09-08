import { default as React } from 'react';
import { SelectOption } from '../form-select-types';
export type FormSelectContextValue = {
    selectOption: (option: SelectOption) => void;
    selectedOption?: SelectOption;
    disabled?: boolean;
    isSearchable?: boolean;
    searchTerm?: string;
};
export declare const FormSelectProvider: React.FC<React.PropsWithChildren<{
    value: FormSelectContextValue;
}>>;
export declare const useFormSelectContext: () => FormSelectContextValue;

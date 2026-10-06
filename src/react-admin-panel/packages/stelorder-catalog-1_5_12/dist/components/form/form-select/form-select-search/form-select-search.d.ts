import { default as React } from 'react';
type FormSelectSearchProps = {
    value: string;
    onChange: (value: string) => void;
    htmlProps?: React.HTMLProps<HTMLInputElement>;
    placeholder?: string;
};
export declare const FormSelectSearch: React.FC<FormSelectSearchProps>;
export {};

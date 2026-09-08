import { default as React } from 'react';
type FormSelectDropdownProps = {
    isOpen: boolean;
    boxPosition?: "top" | "bottom";
    maxWidth?: string;
    children: React.ReactNode;
    htmlProps?: React.HTMLProps<HTMLDivElement>;
};
export declare const FormSelectDropdown: React.FC<FormSelectDropdownProps>;
export {};

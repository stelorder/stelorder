import { ReactNode } from 'react';
export type SelectOption = {
    label: string;
    value: string;
    clickable?: boolean;
    level?: "Default" | "Tabulado";
};
export type FormSelectOptionProps = {
    value: string;
    label?: string;
    children?: ReactNode;
    clickable?: boolean;
    level?: "Default" | "Tabulado";
};

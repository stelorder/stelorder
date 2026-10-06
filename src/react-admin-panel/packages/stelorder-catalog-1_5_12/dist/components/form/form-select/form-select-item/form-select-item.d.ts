import { default as React, PropsWithChildren } from 'react';
import { ListItemProps } from '../../../list/list-item/list-item.types';
import { HtmlProps } from '../../..';
export type FormSelectItemProps = PropsWithChildren<ListItemProps & HtmlProps<HTMLDivElement> & {
    value: string;
    level?: "Default" | "Tabulado";
    htmlProps?: React.HTMLProps<HTMLDivElement>;
    searchValue?: string;
}>;
export declare const FormSelectItem: React.FC<FormSelectItemProps>;

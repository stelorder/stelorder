import { default as React, HtmlHTMLAttributes, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
interface SearchableTableProps extends HtmlHTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
}
declare const SearchableTable: React.FC<SearchableTableProps>;
interface SearchableColumnProps extends PropsWithChildren<HtmlProps<HTMLTableCellElement>> {
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    sortable?: boolean;
    sortDirection?: "asc" | "desc" | null;
    onSort?: () => void;
    sortButtonAriaLabel?: string;
}
export declare const SearchableColumn: React.FC<SearchableColumnProps>;
interface ColumnProps extends PropsWithChildren<HtmlProps<HTMLTableCellElement>> {
    sortable?: boolean;
    sortDirection?: "asc" | "desc" | null;
    onSort?: () => void;
    sortButtonAriaLabel?: string;
}
export declare const Column: React.FC<ColumnProps>;
type ActionColumnProps = PropsWithChildren<HtmlProps<HTMLTableCellElement>>;
export declare const ActionColumn: React.FC<ActionColumnProps>;
export default SearchableTable;

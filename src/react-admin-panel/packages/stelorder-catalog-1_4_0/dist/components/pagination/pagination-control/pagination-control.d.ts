import { default as React } from 'react';
import { HtmlProps } from '../../styles/theme';
export type PaginationControlText = {
    firstPage: string;
    lastPage: string;
};
export type PaginationControlProps = {
    paginationText?: PaginationControlText;
    currentPage: number;
    totalPages: number;
    disabled?: boolean;
    handleNextPage?: () => void;
    handlePreviousPage?: () => void;
    handleFirstPage?: () => void;
    handleLastPage?: () => void;
} & HtmlProps<HTMLDivElement>;
declare const PaginationControl: React.FC<PaginationControlProps>;
export default PaginationControl;

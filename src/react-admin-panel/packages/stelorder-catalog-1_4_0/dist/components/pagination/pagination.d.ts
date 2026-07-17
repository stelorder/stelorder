import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
import { PaginationConfigText } from './pagination-config/pagination-config';
import { SelectOption } from '../form/form-select/form-select-types';
import { PaginationControlText } from './pagination-control/pagination-control';
export type PaginationText = {
    paginationConfigText?: PaginationConfigText;
    paginationControlText?: PaginationControlText;
};
export type PaginationConfigProps = {
    firstElementPageNumber: number;
    lastElementPageNumber: number;
    lastElementNumber: number;
};
export type PaginationProps = {
    paginationText?: PaginationText;
    fetchData: (page: number, elementsPerPage: number) => Promise<{
        page: number;
        totalPages: number;
    }>;
    disabled?: boolean;
    elementsPerPage: SelectOption[];
    paginationConfig: PaginationConfigProps;
    totalPages: number;
    onChangeIsLoading?: (isLoading: boolean) => void;
};
declare const Pagination: React.FC<PaginationProps & HtmlProps<HTMLDivElement>>;
export default Pagination;

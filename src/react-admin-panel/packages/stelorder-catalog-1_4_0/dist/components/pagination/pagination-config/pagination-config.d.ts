import { default as React } from 'react';
import { HtmlProps } from '../../styles/theme';
import { SelectOption } from '../../form/form-select/form-select-types';
export type PaginationConfigText = {
    listingTextTemplate: (firstElementPageNumber: number, lastElementPageNumber: number, lastElementNumber: number) => string;
    perPageText: string;
};
export type PaginationConfigProps = {
    paginationText?: PaginationConfigText;
    disabled?: boolean;
    firstElementPageNumber: number;
    lastElementPageNumber: number;
    lastElementNumber: number;
    elementsSelectId: string;
    elementsPerPage: SelectOption[];
    currentElementsPerPage: SelectOption;
    onChangeElementsPerPage: (elementsPerPageOption: SelectOption) => void;
} & HtmlProps<HTMLDivElement>;
declare const PaginationConfig: React.FC<PaginationConfigProps>;
export default PaginationConfig;

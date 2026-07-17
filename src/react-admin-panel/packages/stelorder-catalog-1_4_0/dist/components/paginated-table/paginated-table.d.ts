import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
import { PaginationProps } from '../pagination/pagination';
declare const PaginatedTable: React.FC<PropsWithChildren<PaginationProps & HtmlProps<HTMLDivElement>>>;
export default PaginatedTable;

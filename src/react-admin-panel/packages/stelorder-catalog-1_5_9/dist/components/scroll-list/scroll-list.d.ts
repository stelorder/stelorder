import { default as React, ElementType, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
declare const ScrollList: React.FC<PropsWithChildren<{
    title: string;
    containerElement?: ElementType;
} & HtmlProps<HTMLDivElement>>>;
export default ScrollList;

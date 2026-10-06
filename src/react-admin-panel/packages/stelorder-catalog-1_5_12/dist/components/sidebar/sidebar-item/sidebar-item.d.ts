import { default as React } from 'react';
import { HtmlProps } from '../../styles/theme';
export type SidebarItemProps = HtmlProps<HTMLDivElement> & {
    children: React.ReactNode;
    expand?: boolean;
};
export declare const SidebarItem: ({ htmlProps, children, expand, }: SidebarItemProps) => React.JSX.Element;

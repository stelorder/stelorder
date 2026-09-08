import { default as React } from 'react';
import { HtmlProps } from '../../styles/theme';
export type SidebarItemProps = HtmlProps<HTMLDivElement> & {
    children: React.ReactNode;
    expand?: boolean;
};
export declare const SidebarItem: ({ htmlProps, children, expand, }: SidebarItemProps) => import("react/jsx-runtime").JSX.Element;

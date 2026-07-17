import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
import { SidebarItem } from './sidebar-item/sidebar-item';
export type SidebarProps = HtmlProps<HTMLDivElement> & {
    children: React.ReactNode;
    width?: string;
    height?: string;
};
declare const SidebarBase: ({ htmlProps, children, width, height }: SidebarProps) => import("react/jsx-runtime").JSX.Element;
type SidebarComponent = typeof SidebarBase & {
    Item: typeof SidebarItem;
};
declare const Sidebar: SidebarComponent;
export default Sidebar;

import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
import { ToolbarItemProps } from './toolbar-item/toolbar-item';
export type ToolbarProps = PropsWithChildren<HtmlProps<HTMLDivElement> & {
    height?: string;
    width?: string;
    backgroundColor?: string;
}>;
type ToolbarComponent = React.FC<ToolbarProps> & {
    Item: React.FC<ToolbarItemProps>;
};
declare const toolbarComponent: ToolbarComponent;
export default toolbarComponent;

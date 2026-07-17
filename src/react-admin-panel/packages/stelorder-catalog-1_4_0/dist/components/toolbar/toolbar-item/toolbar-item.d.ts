import { PropsWithChildren } from 'react';
import { HtmlProps } from '../../styles/theme';
export type ToolbarItemPosition = "start" | "center" | "end";
export type ToolbarItemProps = PropsWithChildren<HtmlProps<HTMLDivElement> & {
    position?: ToolbarItemPosition;
    columns?: number | "auto";
    expand?: boolean;
}>;
declare const ToolbarItem: {
    ({ children }: ToolbarItemProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default ToolbarItem;

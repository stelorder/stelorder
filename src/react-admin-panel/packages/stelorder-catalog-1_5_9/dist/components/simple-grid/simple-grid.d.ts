import { default as React, ReactElement } from 'react';
import { default as SimpleGridItem, SimpleGridItemProps } from './simple-grid-item/simple-grid-item';
import { breakpointsType, HtmlProps } from '../styles/theme';
export type GridDirection = "row" | "column";
export type GridAlign = "start" | "center" | "end" | "stretch" | "between" | "around";
type SimpleGridResponsiveProps = {
    [key in breakpointsType]?: SimpleGridBasicProps;
};
export type SimpleGridBasicProps = {
    direction?: GridDirection;
    wrap?: boolean;
    alignX?: GridAlign;
    alignY?: GridAlign;
    gap?: number;
};
export type SimpleGridProps = {
    fullWidth?: boolean;
    itemsPerLine?: number;
} & SimpleGridBasicProps & SimpleGridResponsiveProps;
declare const SimpleGrid: React.FC<SimpleGridProps & {
    children: ReactElement<SimpleGridItemProps> | ReactElement<SimpleGridItemProps>[];
} & HtmlProps<HTMLDivElement>>;
export type SimpleGridComponent = typeof SimpleGrid & {
    Item: typeof SimpleGridItem;
};
declare const simpleGridComponent: SimpleGridComponent;
export default simpleGridComponent;

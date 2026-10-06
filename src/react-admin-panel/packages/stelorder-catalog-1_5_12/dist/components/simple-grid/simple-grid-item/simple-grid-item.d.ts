import { default as React, PropsWithChildren } from 'react';
import { breakpointsType, HtmlProps } from '../../styles/theme';
export type ItemAlign = "start" | "center" | "end" | "stretch";
type Dir = "t" | "b" | "s" | "e";
export type Spacing = {
    [key in Dir]?: number | "auto";
};
type Spacings = {
    m?: Spacing;
    p?: Spacing;
};
export type SimpleGridItemBasicProps = {
    col?: number | "auto";
    align?: ItemAlign;
} & Spacings;
export type SimpleGridItemResponsiveProps = {
    [key in breakpointsType]?: SimpleGridItemBasicProps;
};
export type SimpleGridItemProps = SimpleGridItemBasicProps & SimpleGridItemResponsiveProps;
declare const SimpleGridItem: React.FC<PropsWithChildren<SimpleGridItemProps> & HtmlProps<HTMLDivElement>>;
export default SimpleGridItem;

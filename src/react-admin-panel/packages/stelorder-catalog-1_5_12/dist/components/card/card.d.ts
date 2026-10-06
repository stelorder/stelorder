import { default as React, PropsWithChildren } from 'react';
import { breakpointsType, HtmlProps } from '../styles/theme';
import { default as CardBody } from './card-body/card-body';
import { default as CardTitle } from './card-title/card-title';
import { default as CardText } from './card-text/card-text';
export type TextAlign = "start" | "end" | "center";
export type CardBasicsProps = {
    text?: TextAlign;
    border?: string;
    shadow?: boolean;
    rounded?: boolean;
    hook?: boolean;
};
export type CardResponsiveProps = {
    [key in breakpointsType]?: CardBasicsProps;
};
export type CardProps = CardBasicsProps & CardResponsiveProps;
declare const CardBase: React.FC<CardProps & PropsWithChildren<HtmlProps<HTMLDivElement>> & {
    className?: string;
}>;
type CardComponent = typeof CardBase & {
    Body: typeof CardBody;
    Title: typeof CardTitle;
    Text: typeof CardText;
};
declare const Card: CardComponent;
export default Card;

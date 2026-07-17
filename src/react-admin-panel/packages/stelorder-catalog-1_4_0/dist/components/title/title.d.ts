import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
export type TitleVariant = "default" | "primary";
export type TextAlign = "left" | "center" | "right";
declare const Title: React.FC<React.PropsWithChildren<{
    variant?: TitleVariant;
    textAlign?: TextAlign;
} & HtmlProps<HTMLHeadingElement>>>;
export default Title;

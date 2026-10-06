import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
/**
 * - `default`: 16px/700 (`titleL700`).
 * - `primary`: 16px/500 (`titleL500`).
 * - `xl`: 20px/500 (`titleXl500`), pensada para títulos de modal.
 */
export type TitleVariant = "default" | "primary" | "xl";
export type TextAlign = "left" | "center" | "right";
declare const Title: React.FC<React.PropsWithChildren<{
    variant?: TitleVariant;
    textAlign?: TextAlign;
} & HtmlProps<HTMLHeadingElement>>>;
export default Title;

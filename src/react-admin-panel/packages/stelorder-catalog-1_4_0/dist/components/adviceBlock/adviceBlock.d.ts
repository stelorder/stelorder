import { PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
export type AdviceBlockType = "info";
export type AdviceBlockProps = {
    variant?: AdviceBlockType;
};
declare function AdviceBlock({ variant, children, htmlProps, }: AdviceBlockProps & PropsWithChildren<HtmlProps<HTMLDivElement>>): import("react/jsx-runtime").JSX.Element;
export default AdviceBlock;

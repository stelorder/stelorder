import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
import { CSSObject } from 'styled-components';
export type IconWrapperStyles = {
    default?: CSSObject;
    hover?: CSSObject | false;
    focus?: CSSObject | false;
};
declare const IconWrapper: React.FC<React.PropsWithChildren<{
    color?: string;
    height?: string;
    width?: string;
    radius?: string;
    border?: string;
    styles?: IconWrapperStyles;
    ariaLabel?: string;
} & HtmlProps<HTMLDivElement>>>;
export default IconWrapper;

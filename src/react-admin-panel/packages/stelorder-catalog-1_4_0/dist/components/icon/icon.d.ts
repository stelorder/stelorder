import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
import { IconVariant, StrokeLinecap, StrokeLinejoin } from './icon-constants';
import * as Utils from "./icon-utils";
export type SizePx = string;
export type IconProps = {
    variant: IconVariant;
    color?: string;
    width?: SizePx;
    height?: SizePx;
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: StrokeLinecap;
    strokeLinejoin?: StrokeLinejoin;
};
declare const Icon: React.FC<IconProps & PropsWithChildren<HtmlProps<SVGSVGElement>>>;
export type IconComponentType = typeof Icon & {
    Utils: typeof Utils;
};
declare const IconComponent: IconComponentType;
export default IconComponent;

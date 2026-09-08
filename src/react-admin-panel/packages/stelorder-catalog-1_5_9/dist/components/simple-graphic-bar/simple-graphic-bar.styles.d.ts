import { HTMLAttributes } from 'react';
import { StyledProp } from '../styles/theme';
import { SimpleBarChartProps } from './simple-graphic-bar';
type StyledSimpleBarChartProps<XK extends string, YK extends string> = StyledProp<SimpleBarChartProps<XK, YK>>;
export declare const StyledSimpleBarChart: <XK extends string, YK extends string>({ $styled, ...htmlProps }: StyledSimpleBarChartProps<XK, YK> & HTMLAttributes<SVGElement>) => import("react/jsx-runtime").JSX.Element;
export {};

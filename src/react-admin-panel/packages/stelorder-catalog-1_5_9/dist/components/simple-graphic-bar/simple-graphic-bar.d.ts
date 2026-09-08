import { HtmlProps } from '../styles/theme';
export type SimpleBarChartProps<XK extends string, YK extends string> = {
    xKey: XK;
    yKey: YK;
    color: `#${string}` | string;
    width: number | string;
    height: number | string;
    data: Array<{
        [key in XK]: string;
    } & {
        [key in YK]: number;
    }>;
};
declare const SimpleBarChart: <XK extends string, YK extends string>({ xKey, yKey, color, width, height, data, htmlProps, }: SimpleBarChartProps<XK, YK> & HtmlProps<SVGElement>) => import("react/jsx-runtime").JSX.Element;
export default SimpleBarChart;

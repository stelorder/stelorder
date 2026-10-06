import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
export type ProgressBarProps = {
    now: number;
    color?: string;
    trackColor?: string;
    borderColor?: string;
    width?: string | number;
    height?: string | number;
    label?: boolean;
    ariaLabel?: string;
};
declare const ProgressBar: React.FC<ProgressBarProps & HtmlProps<HTMLDivElement>>;
export default ProgressBar;

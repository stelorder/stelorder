import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
export type SegmentedSwitchProps = {
    defaultValue?: number | null;
    clearable?: boolean;
    padding?: string;
    orientation?: "horizontal" | "vertical";
    onChange?: (value: number | null) => void;
};
declare const SegmentedSwitch: React.FC<PropsWithChildren<SegmentedSwitchProps & HtmlProps<HTMLDivElement>>>;
export default SegmentedSwitch;

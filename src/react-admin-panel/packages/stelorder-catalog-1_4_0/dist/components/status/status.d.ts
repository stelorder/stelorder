import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
export type StatusType = "success" | "danger" | "warning" | "info" | "paused" | "active";
export type StatusOrderElements = {
    label: number;
    icon: number;
    text: number;
};
declare const Status: React.FC<{
    gap?: number;
    status: StatusType;
    order?: Partial<StatusOrderElements>;
    label?: string;
    statusText?: string;
} & HtmlProps<HTMLDivElement>>;
export default Status;

import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
export type StatusType = "success" | "danger" | "warning" | "info" | "paused" | "active";
export type StatusOrderElements = {
    label: number;
    icon: number;
    text: number;
};
/**
 * - `default`: círculo macizo de 14px.
 * - `dot`: punto de 11px con borde claro (`statusDot`).
 */
export type StatusVariant = "default" | "dot";
declare const Status: React.FC<{
    gap?: number;
    status: StatusType;
    variant?: StatusVariant;
    order?: Partial<StatusOrderElements>;
    label?: string;
    statusText?: string;
} & HtmlProps<HTMLDivElement>>;
export default Status;

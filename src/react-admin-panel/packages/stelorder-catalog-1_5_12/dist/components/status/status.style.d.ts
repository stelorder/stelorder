import { StyledProp } from '../styles/theme';
import { StatusOrderElements, StatusType, StatusVariant } from './status';
import { default as React, HTMLAttributes } from 'react';
export declare const StyledStatusComponent: React.FC<StyledProp<{
    gap: number;
    status: StatusType;
    variant: StatusVariant;
    order: StatusOrderElements;
    label?: string;
    statusText?: string;
}> & HTMLAttributes<HTMLDivElement>>;

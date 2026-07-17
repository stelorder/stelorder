import { StyledProp } from '../styles/theme';
import { StatusOrderElements, StatusType } from './status';
import { default as React, HTMLAttributes } from 'react';
export declare const StyledStatusComponent: React.FC<StyledProp<{
    gap: number;
    status: StatusType;
    order: StatusOrderElements;
    label?: string;
    statusText?: string;
}> & HTMLAttributes<HTMLDivElement>>;

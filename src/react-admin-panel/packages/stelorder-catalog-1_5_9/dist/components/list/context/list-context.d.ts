import { default as React, PropsWithChildren } from 'react';
export type ListContextValue = {
    hasDivider?: boolean;
    level?: number;
    paddingBase?: number;
};
export declare const ListProvider: React.FC<PropsWithChildren<{
    hasDivider?: boolean;
    level?: number;
    paddingBase?: number;
}>>;
export declare const useListContext: () => ListContextValue;

import { default as React, PropsWithChildren } from 'react';
export type ListContextValue = {
    hasDivider?: boolean;
};
export declare const ListProvider: React.FC<PropsWithChildren<{
    hasDivider?: boolean;
}>>;
export declare const useListContext: () => ListContextValue;

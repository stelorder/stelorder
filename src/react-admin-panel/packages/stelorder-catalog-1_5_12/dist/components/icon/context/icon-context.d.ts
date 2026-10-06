import { default as React, PropsWithChildren } from 'react';
import { IconVariant } from '../icon-constants';
type IconPreloadContextValue = {
    preload: (variant: IconVariant) => Promise<void>;
};
export declare const IconPreloadProvider: React.FC<PropsWithChildren<{
    variants?: IconVariant[];
}>>;
export declare const useIconPreload: () => IconPreloadContextValue;
export {};

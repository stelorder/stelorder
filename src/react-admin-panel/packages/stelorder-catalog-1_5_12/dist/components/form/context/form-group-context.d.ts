import { default as React, PropsWithChildren } from 'react';
export type FormGroupContextValue = {
    controlId?: string;
};
export declare const FormGroupProvider: React.FC<PropsWithChildren<{
    controlId?: string;
}>>;
export declare const useFormGroupContext: () => FormGroupContextValue;

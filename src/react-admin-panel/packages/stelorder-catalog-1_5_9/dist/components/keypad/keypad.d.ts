import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
export type KeypadKeyVariant = "default" | "accent";
/**
 * - `compact`: teclas fijas de 135x44px, pensado para grids pequeños (ej. PIN).
 * - `fluid`: teclas que ocupan el 100% del ancho disponible, 82px de alto.
 */
export type KeypadSize = "compact" | "fluid";
export type KeypadKey = {
    value: string;
    label: React.ReactNode;
    variant?: KeypadKeyVariant;
    colSpan?: number;
    disabled?: boolean;
};
export type KeypadProps = {
    keys: KeypadKey[];
    columns: number;
    size?: KeypadSize;
    onKeyPress: (value: string) => void;
} & HtmlProps<HTMLDivElement>;
declare const Keypad: React.FC<KeypadProps>;
export default Keypad;

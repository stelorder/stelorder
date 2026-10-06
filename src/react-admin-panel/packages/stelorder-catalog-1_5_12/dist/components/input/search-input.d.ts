import { HtmlProps } from '../styles/theme';
import { default as React, PropsWithChildren, ReactNode } from 'react';
export type SearchInputSize = "m" | "l" | "xl";
/**
 * Aspecto del campo:
 * - `filled` (por defecto): fondo gris claro, sin borde, radio 8px.
 * - `outlined`: caja blanca de 30px con borde suave y radio 6px; el texto se
 *   refuerza en hover/foco y el borde pasa a `orderPrimary90` al enfocar.
 *   Pensada para buscadores sobre barras de cabecera.
 */
export type SearchInputVariant = "filled" | "outlined";
export type SearchInputProps = {
    size?: SearchInputSize;
    variant?: SearchInputVariant;
    /** Ocupa el ancho disponible en lugar del ancho fijo del `size`. */
    fluid?: boolean;
    /**
     * Contenido fijo a la izquierda del campo (normalmente un `Icon` de lupa).
     * Al pasarlo, el aspecto de la variante lo dibuja la caja que agrupa adorno y
     * campo, y el campo queda transparente dentro de ella.
     */
    startAdornment?: ReactNode;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};
export default function SearchInput({ children, size, variant, fluid, startAdornment, value, onChange, placeholder, htmlProps, ...rest }: PropsWithChildren<SearchInputProps & HtmlProps<HTMLInputElement>>): React.JSX.Element;

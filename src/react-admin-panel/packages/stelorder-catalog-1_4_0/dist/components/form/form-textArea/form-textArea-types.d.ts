export type TextAreaVariant = "default" | "inner";
export type TextAreaStateStyles = {
    borderColor?: string;
    boxShadow?: string;
    backgroundColor?: string;
    color?: string;
    placeholderColor?: string;
    padding?: string;
};
/** undefined = usa el tema.
 *  false = desactiva el estado completamente.
 * objeto = estilos personalizados. */
export type TextAreaStyles = {
    default?: TextAreaStateStyles;
    hover?: TextAreaStateStyles | false;
    focus?: TextAreaStateStyles | false;
    disabled?: TextAreaStateStyles | false;
};

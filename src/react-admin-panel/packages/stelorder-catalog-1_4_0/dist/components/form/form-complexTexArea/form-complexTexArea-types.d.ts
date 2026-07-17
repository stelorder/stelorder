export type ComplexTextAreaStateStyles = {
    borderColor?: string;
    boxShadow?: string;
    backgroundColor?: string;
};
export type ComplexTextAreaContainerStyles = {
    default?: ComplexTextAreaStateStyles;
    hover?: ComplexTextAreaStateStyles | false;
    focus?: ComplexTextAreaStateStyles | false;
};
export type ComplexTextAreaTextAreaStyles = {
    default?: ComplexTextAreaStateStyles & {
        color?: string;
        placeholderColor?: string;
        padding?: string;
    };
    hover?: (ComplexTextAreaStateStyles & {
        color?: string;
        placeholderColor?: string;
        padding?: string;
    }) | false;
    focus?: (ComplexTextAreaStateStyles & {
        color?: string;
        placeholderColor?: string;
        padding?: string;
    }) | false;
    disabled?: (ComplexTextAreaStateStyles & {
        color?: string;
        placeholderColor?: string;
        padding?: string;
    }) | false;
};
export type ComplexTextAreaStyles = {
    container?: ComplexTextAreaContainerStyles;
    textarea?: ComplexTextAreaTextAreaStyles;
};

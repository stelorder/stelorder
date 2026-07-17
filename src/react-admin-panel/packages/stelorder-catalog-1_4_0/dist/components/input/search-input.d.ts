import { HtmlProps } from '../styles/theme';
import { PropsWithChildren } from 'react';
export type SearchInputSize = "m" | "l" | "xl";
export type SearchInputProps = {
    size?: SearchInputSize;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};
export default function SearchInput({ children, size, value, onChange, placeholder, htmlProps, ...rest }: PropsWithChildren<SearchInputProps & HtmlProps<HTMLInputElement>>): import("react/jsx-runtime").JSX.Element;

import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
import { default as SelectCardTitle } from './selectCard-title/selectCard-title';
import { default as SelectCardText } from './selectCard-text/selectCard-text';
import { CardProps } from '../card/card';
type SelectCardBaseProps = PropsWithChildren<CardProps & HtmlProps<HTMLDivElement> & {
    selected?: boolean;
    disabled?: boolean;
    required?: boolean;
    onSelect?: (selected: boolean) => void;
}>;
declare const SelectCardBase: React.FC<SelectCardBaseProps>;
type SelectCardComponent = typeof SelectCardBase & {
    Title: typeof SelectCardTitle;
    Text: typeof SelectCardText;
};
declare const SelectCard: SelectCardComponent;
export default SelectCard;

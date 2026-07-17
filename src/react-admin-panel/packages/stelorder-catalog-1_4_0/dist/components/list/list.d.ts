import { default as React, PropsWithChildren, ComponentPropsWithoutRef } from 'react';
import { HtmlProps } from '../styles/theme';
import { ListGroup } from './list-group/list-group';
import { ListItem } from './list-item/list-item';
export interface ListProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
    title?: React.ReactNode;
    maxHeight?: number | string;
    dividers?: boolean;
}
declare function ListBase({ title, children, maxHeight, dividers, ...rest }: PropsWithChildren<ListProps & HtmlProps<HTMLFormElement>>): import("react/jsx-runtime").JSX.Element;
type ListComponent = typeof ListBase & {
    Group: typeof ListGroup;
    Item: typeof ListItem;
};
declare const List: ListComponent;
export default List;

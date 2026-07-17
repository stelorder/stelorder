import { default as React } from 'react';
import { ListItemProps } from './list-item.types';
declare const Label: React.FC<React.HTMLAttributes<HTMLSpanElement>>;
declare const Description: React.FC<React.HTMLAttributes<HTMLSpanElement>>;
declare const EndContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
declare const ListItemBase: React.FC<ListItemProps>;
type ListItemComponent = typeof ListItemBase & {
    Label: typeof Label;
    Description: typeof Description;
    EndContent: typeof EndContent;
};
declare const ListItem: ListItemComponent;
export { ListItem };

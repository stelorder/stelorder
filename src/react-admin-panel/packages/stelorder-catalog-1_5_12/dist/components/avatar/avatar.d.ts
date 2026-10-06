import { PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
import { SizePx } from '../icon/icon.style';
export interface AvatarProps {
    size?: SizePx;
    src?: string | null;
    alt?: string;
    color?: string;
}
declare function Avatar({ size, src, alt, color, children, htmlProps, }: AvatarProps & PropsWithChildren<HtmlProps<HTMLDivElement>>): import('react').JSX.Element;
export default Avatar;

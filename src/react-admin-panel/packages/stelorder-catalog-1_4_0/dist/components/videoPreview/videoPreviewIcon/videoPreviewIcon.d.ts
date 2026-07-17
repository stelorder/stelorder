import { default as React } from 'react';
import { SizePx } from '../../icon/icon.style';
import { IconVariant } from '../../icon/icon-constants';
export type VideoPreviewIconProps = {
    variant: IconVariant;
    size?: SizePx;
    color?: string;
    bg?: string;
    className?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
};
export default function VideoPreviewIcon({ variant, size, color, className, onClick, ...rest }: VideoPreviewIconProps): import("react/jsx-runtime").JSX.Element;

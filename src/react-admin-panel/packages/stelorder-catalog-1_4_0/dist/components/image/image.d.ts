import { default as React } from 'react';
import { SizePx } from '../icon/icon.style';
export interface ImageProps {
    fluid?: boolean;
    rounded?: boolean;
    roundedCircle?: boolean;
    thumbnail?: boolean;
    src: string;
    width?: SizePx;
    height?: SizePx;
    onClick?: React.MouseEventHandler<HTMLImageElement>;
}
declare const Image: React.FC<ImageProps & React.ImgHTMLAttributes<HTMLImageElement>>;
export default Image;

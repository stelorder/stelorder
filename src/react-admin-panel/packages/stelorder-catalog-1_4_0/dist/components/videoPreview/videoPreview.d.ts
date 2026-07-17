import { default as React } from 'react';
import { default as VideoPreviewIcon } from './videoPreviewIcon/videoPreviewIcon';
import { SizePx } from '../icon/icon.style';
export interface VideoProps {
    src: string;
    previewSrc?: string;
    fluid?: boolean;
    rounded?: boolean;
    roundedCircle?: boolean;
    thumbnail?: boolean;
    width?: SizePx;
    height?: SizePx;
}
export type VideoPreviewCompound = React.FC<VideoProps & React.ImgHTMLAttributes<HTMLImageElement> & {
    children?: React.ReactNode;
}> & {
    Icon: typeof VideoPreviewIcon;
};
declare const VideoPreview: VideoPreviewCompound;
export default VideoPreview;

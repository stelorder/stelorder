export interface AudioVisualizerProps {
    count?: number;
    color?: string;
    speed?: number;
    width?: number;
    maxHeight?: number;
    borderRadius?: string;
    gap?: number;
}
declare const AudioVisualizer: {
    ({ count, color, speed, width, maxHeight, borderRadius, gap, }: AudioVisualizerProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export default AudioVisualizer;

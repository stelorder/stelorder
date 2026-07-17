import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
export type CarouselProps = {
    gap?: string;
};
export type CarouselSlideProps = {
    id: string;
};
declare const CarouselSlide: React.FC<CarouselSlideProps & PropsWithChildren<HtmlProps<HTMLDivElement>>>;
export type CarouselComponent = React.FC<CarouselProps & PropsWithChildren<HtmlProps<HTMLDivElement>>> & {
    Slide: typeof CarouselSlide;
};
declare const CarouselWithSlide: CarouselComponent;
export default CarouselWithSlide;

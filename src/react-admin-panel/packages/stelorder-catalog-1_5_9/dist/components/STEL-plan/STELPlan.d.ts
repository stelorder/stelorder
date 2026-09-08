import { default as React } from 'react';
import { HtmlProps } from '../styles/theme';
export type STELPlanVariant = "free" | "lite" | "business" | "pro";
declare const STELPlan: React.FC<React.PropsWithChildren<{
    variant?: STELPlanVariant;
} & HtmlProps<HTMLHeadingElement>>>;
export default STELPlan;

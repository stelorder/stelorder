import { PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
import { default as NavbarTab } from './navbar-tab/navbar-tab';
import { TooltipProps } from '../tooltip/tooltip';
declare function NavbarBase({ children, options, htmlProps, }: PropsWithChildren<{
    options?: TooltipProps;
} & HtmlProps<HTMLFormElement>>): import("react/jsx-runtime").JSX.Element;
type NavbarComponent = typeof NavbarBase & {
    Tab: typeof NavbarTab;
};
declare const Navbar: NavbarComponent;
export default Navbar;

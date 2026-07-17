import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../../styles/theme';
export type NavbarLabelProps = {
    htmlFor?: string;
    className?: string;
};
declare const NavbarTab: React.FC<PropsWithChildren<NavbarLabelProps & HtmlProps<HTMLLabelElement>>>;
export default NavbarTab;

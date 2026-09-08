import { default as React, PropsWithChildren } from 'react';
import { IntegrationsThemeType } from './theme';
type Props = PropsWithChildren<{
    theme?: IntegrationsThemeType;
}>;
declare const AppThemeProvider: React.FC<Props>;
export default AppThemeProvider;

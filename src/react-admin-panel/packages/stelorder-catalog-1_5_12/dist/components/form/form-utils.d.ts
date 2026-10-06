import { ValidatingState } from './form-types';
import { IntegrationsThemeType } from '../styles/theme';
export declare function mapState(isValid?: boolean, isInvalid?: boolean): ValidatingState;
export declare function createValidatingFormControlCssBlock({ state, theme, }: {
    state?: ValidatingState;
    theme: IntegrationsThemeType;
}): import('styled-components').RuleSet<object>;

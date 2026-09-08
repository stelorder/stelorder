import { default as React } from 'react';
import { CalendarLocale } from './translations';
export type { CalendarLocale } from './translations';
export type CalendarProps = {
    value?: string | string[];
    multiple?: boolean;
    locale?: CalendarLocale;
    minDate?: string;
    maxDate?: string;
    disabledDates?: string[] | ((isoDate: string) => boolean);
    isOpen?: boolean;
    showTime?: boolean;
    onAccept?: (value: string | string[]) => void;
    onCancel?: () => void;
};
export declare const Calendar: React.FC<CalendarProps>;
export default Calendar;

import { RefObject } from 'react';
import { SelectOption } from './form-select-types';
export declare function useClickOutside(ref: RefObject<HTMLElement | null>, isOpen: boolean, onClose: () => void): void;
export declare function useSelectFilter(options: SelectOption[] | undefined, parsedOptions: SelectOption[] | null, hasListChildren: boolean, isSearchable: boolean, searchTerm: string): SelectOption[] | null;

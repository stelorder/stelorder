import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../styles/theme';
import { default as DocumentCardInfoBody } from './documentCardInfo-body/documentCardInfo-body';
import { default as DocumentCardInfoFooter } from './documentCardInfo-footer/documentCardInfo-footer';
declare const DocumentCardInfoBase: React.FC<PropsWithChildren<HtmlProps<HTMLDivElement>>>;
type DocumentCardInfoComponent = typeof DocumentCardInfoBase & {
    Body: typeof DocumentCardInfoBody;
    Footer: typeof DocumentCardInfoFooter;
};
declare const DocumentCardInfo: DocumentCardInfoComponent;
export default DocumentCardInfo;

import { default as React, PropsWithChildren } from 'react';
import { HtmlProps } from '../../styles/theme';
import { default as DocumentCardInfoBodyBody } from './documentCardInfo-body-body/documentCardInfo-body-body';
import { default as DocumentCardInfoBodyHeader } from './documentCardInfo-body-header/documentCardInfo-body-header';
declare const DocumentCardInfoBodyBase: React.FC<PropsWithChildren<HtmlProps<HTMLDivElement>>>;
type DocumentCardInfoBodyComponent = typeof DocumentCardInfoBodyBase & {
    Body: typeof DocumentCardInfoBodyBody;
    Header: typeof DocumentCardInfoBodyHeader;
};
declare const DocumentCardInfoBody: DocumentCardInfoBodyComponent;
export default DocumentCardInfoBody;

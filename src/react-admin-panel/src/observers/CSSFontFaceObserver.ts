export interface CSSFontFaceObserverProps {
    document: Document | DocumentFragment;
    styleElemId: string;
}

function observeFontFaceRules({ document, styleElemId, rulesCache }: CSSFontFaceObserverProps & { rulesCache: Set<string>}) {
    const fontFaceRules: string[] = [];

    document.querySelectorAll("style").forEach((styleElement) => {
        try {
            const sheet = styleElement.sheet as CSSStyleSheet;
            if (sheet && sheet.cssRules) {
                Array.from(sheet.cssRules).forEach((rule) => {
                    if (rule instanceof CSSFontFaceRule) {
                        const ruleText = rule.cssText;
                        if (!rulesCache.has(ruleText)) {
                            fontFaceRules.push(ruleText);
                            rulesCache.add(ruleText);
                        }
                    }
                });
            }
        } catch (e) {
            console.warn("No se pudo acceder a las reglas CSS:", e);
        }
    });

    if (fontFaceRules.length > 0) {
        let styleElement = window.document.getElementById(styleElemId) as HTMLStyleElement;

        if (!styleElement) {
            styleElement = window.document.createElement("style");
            styleElement.id = styleElemId;
            window.document.head.appendChild(styleElement);
        }

        const sheet = styleElement.sheet as CSSStyleSheet;

        fontFaceRules.forEach((rule) => {
            try {
                if (sheet) {
                    sheet.insertRule(rule, sheet.cssRules.length);
                }
            } catch (e) {
                console.warn("Error al insertar regla CSS, intentando con textContent:", e);
                styleElement.textContent += rule + '\n';
            }
        });
    }
}


export function createObserveFontFaceRules(props: CSSFontFaceObserverProps) {
    const rulesCache = new Set<string>();
    const observer = new MutationObserver(() => {
        observeFontFaceRules({...props, rulesCache});
    });

    observer.observe(props.document, {
        childList: true,
        subtree: true,
    });

    return observer;
}
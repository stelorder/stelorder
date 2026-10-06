import {useWpApiSettings} from "../../hooks/useWpApiSettings.ts";
import React, {PropsWithChildren, useContext, useId, useMemo, useState} from "react";
import {styled, useTheme} from "styled-components";
import {Alert, AlertProps, Button, HtmlProps, IntegrationsThemeType, Modal} from "@stelsolutions/stelorder-catalog";
import {RootContext} from "../../context/RootContext/RootContext.context.tsx";
import {useTranslation} from "react-i18next";


type AlertWrapperProps =
    PropsWithChildren<AlertProps & HtmlProps<HTMLDivElement>> & {
    className?: string;
    style?: React.CSSProperties;
};

function AlertClassNameBridge({
  className,
  style,
  htmlProps,
  ...rest
}: AlertWrapperProps) {
    return (
        <Alert
            {...rest}
            htmlProps={{
                ...htmlProps,
                className: [htmlProps?.className, className].filter(Boolean).join(" "),
                style: { ...htmlProps?.style, ...style },
            }}
        />
    );
}

const CustomWarningAlert = styled(AlertClassNameBridge)`
    box-sizing: border-box;
    height: 24px;
    width: auto;
    padding: 4px 8px;
    border-radius: 6px;
    gap: 4px;
    margin-left: auto;
    align-self: center;
    align-items: center;
    line-height: 0;
    cursor: pointer;
    ${({ theme }) => (theme as IntegrationsThemeType).fonts.h1500};
    & > svg {
        padding-right: unset!important;
    }
    &:hover {
        background-color: #FFE76C;
    }
`;

const ContainerAlert = styled(AlertClassNameBridge)`
  gap: 4px;
  & > svg {
      padding-right: unset!important;
  }
`;

const warningKeys = [
    'woocommerce-multilingual',
    'woocommerce-pdf-invoices-packing-slips',
    'pdf invoices',
    'translatepress',
    'contuplugin',
    'complianz',
    'captcha'
]

export function PluginAlert() {
    const [open, setOpen] = useState<boolean>(false);
    const { root } = useContext(RootContext) || {root: document.body};
    const { activePlugins } = useWpApiSettings();
    const warningPlugins = useMemo(() => {
        const plugins = activePlugins?.flatMap((plugin) => ({
            ...plugin,
            original: plugin.name,
            name: plugin.name.toLowerCase(),
        }))
        return plugins.filter(
            plugin => !!warningKeys.find(key =>
                plugin.name.includes(key) || plugin.slug.includes(key)
            )
        );
    }, [activePlugins]);

    const { stelUrl } = useWpApiSettings();
    const { t: errorTranslation } = useTranslation("error");
    const theme = useTheme() as IntegrationsThemeType;

    const id = useId();

    return (
        <>
            <Modal
                showIn={root}
                isOpen={open}
                isCentered={true}
                showCloseButton={false}
                animationDurationSec={0.3}
                onClose={() => setOpen(false)}
                htmlProps={{
                    style: {
                        width: 'auto',
                        maxWidth: '100%',
                        minWidth: 0,
                    }
                }}
            >

                <ContainerAlert variant="warning" showCloseButton={false} htmlProps={{ style: { maxWidth: "100%" } }}>
                    <p style={{ marginTop: "0px" }}>
                        {errorTranslation("plugin_alerts.modal.message")}:
                    </p>
                    <ul>
                        {warningPlugins.map((plugin, index) => (
                            <li key={`${id}-plugin-${index}`}>
                                {plugin.original}
                            </li>
                        ))}
                    </ul>
                    <p>
                        {errorTranslation("plugin_alerts.modal.support_message")} <a
                            href={`${stelUrl}/#deepLink=helpCenter`}
                            target="_blank"
                            style={{
                                color: theme.colors.orderSecondary.orderSecondary100,
                                textDecoration: "underline",
                                cursor: "pointer",
                                textDecorationStyle: "solid",
                                textDecorationSkipInk: "none",
                                textDecorationThickness: "auto",
                                textUnderlineOffset: "auto",
                                textUnderlinePosition: "from-font",
                                fontWeight: 700,
                            }}
                        >
                            {errorTranslation("plugin_alerts.modal.support")}
                        </a>
                    </p>
                </ContainerAlert>
                <div style={{ marginTop: "24px" }}>
                    <Button variant="secondary" size={"xl"} htmlProps={{
                        style: { width: "100%" },
                        onClick: () => setOpen(false),
                    }}>
                        {errorTranslation("plugin_alerts.modal.button")}
                    </Button>
                </div>
            </Modal>
            {warningPlugins.length > 0 && (
                <CustomWarningAlert
                    variant="warning"
                    showCloseButton={false}
                    htmlProps={{
                        onClick: () => {
                            if (open) return;
                            setOpen(true);
                        },
                    }}
                >
                    {errorTranslation("plugin_alerts.alerts")}
                </CustomWarningAlert>
            )}
        </>
    );
}
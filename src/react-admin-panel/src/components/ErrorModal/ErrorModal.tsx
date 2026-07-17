
import React, { useContext, useEffect } from "react";
import { Button, Icon, IntegrationsThemeType, Modal, SimpleGrid } from "@stelsolutions/stelorder-catalog";
import { RootContext } from "../../context/RootContext/RootContext.context";
import { useTheme } from "styled-components";
import { useWpApiSettings } from "../../hooks/useWpApiSettings";
import { useTranslation } from "react-i18next";
const ErrorModal: React.FC<{
    isOpen: boolean;
    close: () => void;
    message: string;
    durationMs?: number;
}> = ({
    message,
    isOpen,
    close: show,
    durationMs = 2500
}) => {
    const { stelUrl } = useWpApiSettings();
    const { root } = useContext(RootContext) || { root: document.body };
    const theme = useTheme() as IntegrationsThemeType;
    const { t: errorTranslation } = useTranslation("error");
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isOpen) {
            timer = setTimeout(() => {
                show();
            }, durationMs);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isOpen, durationMs, show]);

    return (
        <Modal
          showIn={root}
          isOpen={isOpen}
          fade={false}
          isCentered={true}
          animationDurationSec={0.3}
          htmlProps={{ as: "section" }}
        >
          <SimpleGrid gap={12} alignY="center">
            <SimpleGrid.Item
              htmlProps={{
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                },
                as: "section",
              }}
            >
              <Icon
                variant="attention"
                width="44px"
                height="44px"
                color="inherit"
              />
              <span
                style={{
                  marginLeft: "12px",
                  ...theme.fonts.titleXl500,
                  color: theme.colors.orderSecondary.orderSecondary100,
                }}
              >
                {errorTranslation("modal_error.title")}
              </span>
            </SimpleGrid.Item>

            <SimpleGrid.Item
              htmlProps={{
                style: {
                  ...theme.fonts.h1400,
                  color: theme.colors.orderSecondary.orderSecondary70,
                },
              }}
            >
              <span>
                {message}
                <a
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
                  {errorTranslation("modal_error.contact_support")}
                </a>
              </span>
              <Button
                variant="gray"
                size="xl"
                htmlProps={{
                  style: {
                    marginTop: "20px",
                    width: "100%",
                  },
                  onClick: () => close(),
                }}
              >
                {errorTranslation("modal_error.button")}
              </Button>
            </SimpleGrid.Item>
          </SimpleGrid>
        </Modal>
    );

}

export { ErrorModal };
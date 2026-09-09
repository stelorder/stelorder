import React, {useContext} from "react";
import { useTheme } from "styled-components";
import {
    Button,
    Icon,
    IconWrapper,
    Modal,
    SimpleGrid,
    Title,
} from "@stelsolutions/stelorder-catalog";
import { useTranslation } from "react-i18next";

import type { IntegrationsThemeType } from "@stelsolutions/stelorder-catalog";
import {RootContext} from "../../../context/RootContext/RootContext.context.tsx";

interface SuccessEventJobModalProps {
    open: boolean;
    onClose: (open: boolean) => void;
}

export const SuccessEventJobModal: React.FC<SuccessEventJobModalProps> = ({
  open,
  onClose,
}) => {
    const theme = useTheme() as IntegrationsThemeType;
    const { t } = useTranslation("configuration");
    const { root } = useContext(RootContext) || {root: document.body};

    return (
        <Modal
            isOpen={open}
            showIn={root}
            isCentered={true}
            fade={true}
            htmlProps={{
                as: "section",
                "aria-label": "Éxito",
                style: {
                    boxSizing: "border-box",
                    borderRadius: "16px",
                    width: "514px",
                    maxWidth: "700px",
                    height: "auto",
                    padding: "24px",
                },
            }}
        >
            <SimpleGrid direction="column" gap={20}>
                <SimpleGrid.Item  htmlProps={{ as: "header" }}>
                    <SimpleGrid gap={10}>
                        <SimpleGrid.Item col="auto">
                            <IconWrapper
                                color={theme.colors.alertSuccess.alertSuccess20}
                                height="44px"
                                width="44px"
                                radius="8px"
                            >
                                <Icon variant="check" height="28px" width="28px" />
                            </IconWrapper>
                        </SimpleGrid.Item>
                        <SimpleGrid.Item htmlProps={{
                            style: {
                                flex: '1 1 0'
                            }
                        }}>
                            <SimpleGrid gap={2}>
                                <SimpleGrid.Item col={1}>
                                    <Title
                                        htmlProps={{
                                            as: "h1",
                                            style: {
                                                ...theme.fonts.titleXl500,
                                                lineHeight: "110%",
                                            },
                                        }}
                                        textAlign="left"
                                        variant="primary"
                                    >
                                        {t("success_event_job.title")}
                                    </Title>
                                </SimpleGrid.Item>
                                <SimpleGrid.Item col={1}>
                                    <p
                                        style={{
                                            ...theme.fonts.h1500,
                                            color: theme.colors.orderSecondary.orderSecondary70,
                                            margin: "0px",
                                        }}
                                    >
                                        {t("success_event_job.message")}
                                    </p>
                                </SimpleGrid.Item>
                            </SimpleGrid>
                        </SimpleGrid.Item>
                    </SimpleGrid>
                </SimpleGrid.Item>
                <SimpleGrid.Item col="auto" htmlProps={{ style: { width: "100%" } }}>
                    <Button
                        size="xl"
                        variant="gray"
                        htmlProps={{
                            onClick: () => onClose(false),
                            style: {
                                width: "100%",
                                ...theme.fonts.h1500,
                            },
                        }}
                    >
                        {t("success_event_job.button")}
                    </Button>
                </SimpleGrid.Item>
            </SimpleGrid>
        </Modal>
    );
};
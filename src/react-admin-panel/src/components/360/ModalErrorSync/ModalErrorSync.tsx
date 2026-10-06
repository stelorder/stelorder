import {useContext, useEffect, useRef, useState} from "react";
import {useTheme} from "styled-components";
import {
    Button,
    Icon,
    IconWrapper,
    IntegrationsThemeType,
    Modal,
    SimpleGrid,
    Title
} from "@stelsolutions/stelorder-catalog";
import {RootContext} from "../../../context/RootContext/RootContext.context.tsx";
import {ListProductError, ProductErrorProps} from "../ListProductError/ListProductError.tsx";
import {useTranslation} from "react-i18next";

type ModalErrorSyncProps = {
   isOpen: boolean;
   closeModal: () => void;
   retrySync: () => void;
   canSync: boolean;
   isLoadingRetry: boolean;
   productErrors: ProductErrorProps[];
   total: number;
   animationDurationSec?: number;
};

export function ModalErrorSync({ isOpen, closeModal, retrySync, canSync, isLoadingRetry, productErrors, total, animationDurationSec }: ModalErrorSyncProps) {
    const theme = useTheme() as IntegrationsThemeType;
    const { root } = useContext(RootContext) || {root: document.body};
    const animationDuration = animationDurationSec || 0.3;
    const [isLoading, setIsLoading] = useState(isLoadingRetry);
    const isLoadingRetryRef = useRef<boolean>(isLoadingRetry);
    const { t } = useTranslation("configuration");

    // Para habilitar los botones cuando el modal se ha ocultado completamente
    useEffect(() => {
        if (!isLoadingRetry && isLoadingRetryRef.current) {
            setTimeout(() => {
                setIsLoading(false);
            }, animationDuration * 1000);
        } else if (isLoadingRetry) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoading(true);
        }
        isLoadingRetryRef.current = isLoadingRetry;
    }, [isLoadingRetry, animationDuration]);

    return (
        <>
            <Modal
                isOpen={isOpen}
                fade={true}
                animationDurationSec={animationDuration}
                isCentered={true}
                showIn={root}
                htmlProps={{
                    as: "section",
                    "aria-label": "Sincronizar productos",
                    style: {
                        borderRadius: "20px",
                        minWidth: "514px",
                        width: "514px",
                        maxWidth: "700px",
                        padding: "24px",
                    },
                }}
            >
                <SimpleGrid direction="column" gap={20}>
                    <SimpleGrid.Item col="auto" htmlProps={{ as: "header" }}>
                        <SimpleGrid gap={10} wrap={false}>
                            <SimpleGrid.Item col={"auto"}>
                                <IconWrapper
                                    color={theme.colors.posPrimary.posPrimary20}
                                    height="44px"
                                    width="44px"
                                    radius="8px"
                                >
                                    <Icon variant="alert" height="21px" width="24px" />
                                </IconWrapper>
                            </SimpleGrid.Item>
                            <SimpleGrid.Item col={"auto"}>
                                <SimpleGrid gap={2}>
                                    <SimpleGrid.Item>
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
                                            {t("sync_error_modal.title")}
                                        </Title>
                                    </SimpleGrid.Item>
                                    <SimpleGrid.Item col={1}>
                                        <p
                                            style={{
                                                ...theme.fonts.h1500,
                                                color: theme.colors.orderSecondary.orderSecondary70,
                                                lineHeight: "110%",
                                                margin: "0px",
                                            }}
                                        >
                                            {productErrors.length} {t("sync_error_modal.message.of")} {total} {t("sync_error_modal.message.failed_message")}
                                        </p>
                                    </SimpleGrid.Item>
                                </SimpleGrid>
                            </SimpleGrid.Item>
                        </SimpleGrid>
                    </SimpleGrid.Item>
                    <SimpleGrid.Item htmlProps={{ style: {width: "100%"}} }>
                        <ListProductError productErrors={productErrors} />
                    </SimpleGrid.Item>

                    <SimpleGrid.Item col="auto" htmlProps={{ style: { width: "100%" } }}>
                        <SimpleGrid gap={10} itemsPerLine={2}>
                            <SimpleGrid.Item col={1}>
                                <Button
                                    size="xl"
                                    variant="gray"
                                    htmlProps={{
                                        onClick: () => {
                                            if (isLoading) return;
                                            closeModal();
                                        },
                                        disabled: isLoading,
                                        style: {
                                            width: "100%",
                                            ...theme.fonts.h1500,
                                        },
                                    }}
                                >
                                    {t("sync_error_modal.btn_close")}
                                </Button>
                            </SimpleGrid.Item>
                            <SimpleGrid.Item col={1}>
                                <Button
                                    size="xl"
                                    variant="secondary"
                                    htmlProps={{
                                        onClick: () => {
                                            if (isLoading || !canSync) return;
                                            retrySync();
                                        },
                                        disabled: isLoading || !canSync,
                                        style: {
                                            width: "100%",
                                            ...theme.fonts.h1500,
                                            gap: "6px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        },
                                    }}
                                >
                                    <Icon
                                        variant="automatic-task"
                                        color={theme.colors.orderSecondary.orderSecondary0}
                                        height="16px"
                                        width="16px"
                                    />
                                    {
                                        isLoadingRetry ? t('select_category_modal.btn_accept_loading') :
                                        t("sync_error_modal.btn_retry")
                                    }
                                </Button>
                            </SimpleGrid.Item>
                        </SimpleGrid>
                    </SimpleGrid.Item>
                </SimpleGrid>
            </Modal>
        </>
    );
}
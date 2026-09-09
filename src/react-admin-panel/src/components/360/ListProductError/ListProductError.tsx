import {useTheme} from "styled-components";
import {IntegrationsThemeType, List} from "@stelsolutions/stelorder-catalog";
import {ProductErrorItem} from "./ProductErrorItem.ts";
import {useId} from "react";
import {useWpApiSettings} from "../../../hooks/useWpApiSettings.ts";
import {useTranslation} from "react-i18next";

export type ProductErrorProps = {
    id: string;
    error: string;
}
export function ListProductError({ productErrors } : {productErrors: ProductErrorProps[]}) {
    const theme = useTheme() as IntegrationsThemeType;
    const listId = useId();
    const { wpAdminUrl } = useWpApiSettings();
    const { t } = useTranslation("configuration");
    return (
        <>
            <h1
                style={{
                    ...theme.fonts.h1500,
                    color: theme.colors.orderSecondary.orderSecondary80,
                    margin: "0px",
                }}
            >
                {t("sync_error_modal.label")}
            </h1>

            <List maxHeight="330px">
                {productErrors.map((productError, i) =>
                    <ProductErrorItem key={`${listId}_${productError.id || i}`} clickable $theme={theme}>
                        <a
                            href={`${wpAdminUrl}post.php?post=${productError.id}&action=edit`}
                            target={'_blank'}
                            style={{
                                textDecoration: 'none',
                                display: 'block',
                                width: 'auto'
                            }}
                        >
                            <h1
                                style={{
                                    ...theme.fonts.h1500,
                                    color: theme.colors.orderSecondary.orderSecondary90,
                                    margin: "0px",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    minWidth: 0,
                                }}
                            >
                                {t("sync_error_modal.product")} {productError.id || i}
                            </h1>

                            <p
                                title={productError.error || "Se ha producido un error"}
                                style={{
                                    ...theme.fonts.h1400,
                                    color: theme.colors.orderSecondary.orderSecondary90,
                                    margin: "0px",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    width: 'auto',
                                    minWidth: 0,
                                }}
                            >
                                {productError.error || "Se ha producido un error"}
                            </p>
                        </a>
                    </ProductErrorItem>
                )}
            </List>
        </>
    );
}
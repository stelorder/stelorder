import {Button, Form, integrationsTheme, SimpleGrid, Title} from "@stelsolutions/stelorder-catalog";
import {useTranslation} from "react-i18next";
import {RootConfig, Warehouse} from "../../../hooks/useFetchConfiguration.ts";
import {SetStateAction, useContext, useState} from "react";
import {useStateIntegration360Config} from "../../../hooks/360/useStateIntegration360Config.ts";
import {ProductSyncModal} from "../ProductSyncModal/ProductSyncModal.tsx";
import {ModalCategorySelect} from "../AvailableCategoriesModal/ModalCategorySelect/ModalCategorySelect.tsx";
import {usePollingEventJobs} from "../../../hooks/360/usePollingEventJobs.ts";
import {EventStatusMeter} from "../EventStatusMeter/EventStatusMeter.tsx";
import {EventJobModal} from "../EventJobModal/EventJobModal.tsx";
import {HelpTooltip} from "../../HelpTooltip/HelpTooltip.tsx";
import {RootContext} from "../../../context/RootContext/RootContext.context.tsx";

export interface ProductConfigProps {
    warehouse_config: { warehouse_id: string };
    product_360_config: {
        sync: boolean;
        fields: { field_rule: string, direction: "TO_PRIMARY" | "TO_SECONDARY" | "BIDIRECTIONAL" }[];
    };
    available_360_module_config: {
        warehouses: Warehouse[];
    };
    updateIntegrationConfig: IntegrationConfigUpdater;
}

export type IntegrationConfigUpdater = ( updateCallback: SetStateAction<RootConfig | null | undefined> ) => void;

export function ProductConfig(props: { isDisabled: boolean, config?: ProductConfigProps }) {
    const { t } = useTranslation("configuration");
    return (
        <SimpleGrid gap={10} itemsPerLine={1} direction="column">
        <SimpleGrid.Item col={1}>
            <Title
                htmlProps={{ as: "h1" }}
                textAlign="left"
                variant="default"
            >
                {t("product_sync_config.title")}
            </Title>
        </SimpleGrid.Item>
            <>
                {
                    props.config ? <ConfigSection config={{...props.config}} isDisabled={props.isDisabled} />: null
                }
            </>
    </SimpleGrid>
    );
}


function ConfigSection({config, isDisabled}: {config: ProductConfigProps, isDisabled: boolean}) {
    const { t: configTranslation } = useTranslation("configuration");
    const { root } = (useContext(RootContext) || {root: document.body}) as { root: HTMLDivElement };
    const [open, setOpen] = useState(false);
    const { productWarehouse, handleProductWarehouseChange, handleProduct360FieldsChange, enableSyncProduct, switchSyncProduct } = useStateIntegration360Config({
        updater: config.updateIntegrationConfig,
        product_360_config: config.product_360_config,
        warehouseConfig: {
            warehouse_id: config.warehouse_config.warehouse_id,
            availables: config.available_360_module_config.warehouses,
        }
    });
    const { isPendingEventLoading, pendingEvent, handlePendingEventId, isProcessing, pollingData, clearPollingData } = usePollingEventJobs();


    return (
        <>
            <EventJobModal
                pendingEvent={pendingEvent}
                eventJobData={pollingData}
                clearEventJobData={clearPollingData}
                handlePendingEventId={handlePendingEventId}
            />
            <SimpleGrid.Item col={1}>
                <SimpleGrid itemsPerLine={2} alignX={"between"}>
                    <SimpleGrid.Item col={"auto"}>
                        <Form.Group>
                            <Form.Checkbox
                                label={<div style={{ display: "flex" }}>
                                    {configTranslation("orders_section.auto_sync_toggle")}
                                    <HelpTooltip message={configTranslation("help.products")} maxWidth={"35vw"} alignMessage={"right"} showIn={root} />
                                </div> as unknown as string}
                                type="switch"
                                isInvalid={false}
                                isValid={false}
                                id="product-checkbox"
                                labelPosition="left"
                                labelGap={12}
                                htmlProps={{
                                    disabled: isDisabled,
                                    onChange: switchSyncProduct,
                                    checked: enableSyncProduct,
                                }}/>
                        </Form.Group>
                    </SimpleGrid.Item>

                    <SimpleGrid.Item col={"auto"}>
                        {
                            isPendingEventLoading ? null :
                            pollingData === null ? <ModalCategorySelect
                                onComplete={handlePendingEventId}
                                isOpen={false}
                                isCentered={true}
                                fade={true}
                                animationDurationSec={0.3}
                            /> : <EventStatusMeter
                                isProcessing={isProcessing}
                                eventJobs={pollingData}
                            />
                        }
                    </SimpleGrid.Item>
                </SimpleGrid>
            </SimpleGrid.Item>
            <SimpleGrid.Item col={1}>
                <SimpleGrid itemsPerLine={2}>
                    <SimpleGrid.Item col={2}>
                        <Form.Group htmlProps={{ style: { textAlign: "left" } }}>
                            <Form.Label
                                htmlProps={{
                                    htmlFor: "refWharehouseProductConfig",
                                    style: {
                                        textAlign: "left",
                                        color:
                                        integrationsTheme.colors.orderSecondary.orderSecondary80,
                                    },
                                }}
                            >
                                {configTranslation("product_sync_config.warehouse_label")}
                            </Form.Label>
                            <SimpleGrid itemsPerLine={2} gap={20}>
                                <SimpleGrid.Item col={1}>
                                    <Form.Select
                                        defaultOption={
                                            {
                                                label: configTranslation("by_default"),
                                                value: "",
                                            }
                                        }
                                        optionValue={productWarehouse}
                                        handleChange={ (opt) => handleProductWarehouseChange(opt) }
                                        options={[
                                            ...config.available_360_module_config.warehouses.map( w => ({
                                                label: w.name,
                                                value: w.id,
                                            }) )
                                        ]}
                                        htmlProps={{
                                            disabled: isDisabled,
                                            id: "refWharehouseProductConfig",
                                            name: "refWharehouseProductConfig",
                                        }}
                                    />
                                </SimpleGrid.Item>
                                <SimpleGrid.Item col={1} htmlProps={{
                                    style: {
                                        alignContent: "end",
                                    }
                                }}>
                                    <Button variant="gray" htmlProps={{
                                        disabled: isDisabled,
                                        type: "button",
                                        style: { maxHeight: "28px" },
                                        onClick: () => setOpen(true),
                                    }}>
                                        {configTranslation("product_sync_config.modal_btn")}
                                    </Button>
                                    <span style={{
                                        marginLeft: "10px",
                                        color: integrationsTheme.colors.orderSecondary.orderSecondary70,
                                        ...integrationsTheme.fonts.h1500,
                                    }}>{config.product_360_config.fields?.length || 0} {configTranslation("product_sync_config.sync_fields")}
                                     <div style={{ display: "inline-flex" }}>
                                         <HelpTooltip message={configTranslation("help.products")} maxWidth={"35vw"} alignMessage={"left"} showIn={root} />
                                     </div>
                                    </span>
                                </SimpleGrid.Item>
                            </SimpleGrid>
                        </Form.Group>
                    </SimpleGrid.Item>
                </SimpleGrid>
            </SimpleGrid.Item>
            <ProductSyncModal
                fields={config.product_360_config.fields}
                isOpen={open}
                close={() => setOpen(false)}
                updateConfig={handleProduct360FieldsChange}
            />
        </>
    )
}
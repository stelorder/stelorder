import {useState} from "react";
import {SelectOption} from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";
import {IntegrationConfigUpdater} from "../../components/360/ProductConfig/ProductConfig.tsx";
import {
    Integration360ModuleConfig,
    IntegrationModuleConfig,
    isIntegration360ModuleConfig,
    RootConfig, Warehouse
} from "../useFetchConfiguration.ts";
import SerialNumberUtils from "../../utils/SerialNumberUtils.ts";

export function useStateIntegration360Config({ updater, warehouseConfig, product_360_config }: {
    updater: IntegrationConfigUpdater,
    warehouseConfig: { warehouse_id?: string, availables?: Warehouse[] };
    product_360_config: {
        sync: boolean;
        fields: { field_rule: string, direction: "TO_PRIMARY" | "TO_SECONDARY" | "BIDIRECTIONAL" }[];
    };
}) {
    const [productWarehouse, setProductWarehouse] = useState<SelectOption | undefined>(SerialNumberUtils.fetchSnOption({
        snId: Number(warehouseConfig.warehouse_id) || null,
        sns: warehouseConfig.availables?.map((wh) => ({
            id: Number(wh.id),
            name: wh.name,
            prefix: "",
            default: false,
        })) || [],
    }));
    return {
        productWarehouse,
        enableSyncProduct: product_360_config.sync,
        switchSyncProduct: () => { updater((prevConfig) => ({
            ...prevConfig!,
            integrationConfig: {
                ...prevConfig!.integrationConfig,
                integration_module_config: prevConfig!.integrationConfig.integration_module_config.map(toggleFieldSync)
            }
        }) ) },
        handleProductWarehouseChange: (option: SelectOption) => {
            updater((prevConfig) => {
                if (!prevConfig) return prevConfig;
                setProductWarehouse(option);
                const result: RootConfig = {
                    ...prevConfig,
                    integrationConfig: {
                        ...prevConfig.integrationConfig,
                        integration_module_config:
                            prevConfig.integrationConfig.integration_module_config.map(
                                (moduleConfig) => updateWarehouse360ModuleConfig(moduleConfig, option)
                            )
                    }
                }
                return result;
            });
        },
        handleProduct360FieldsChange: (fields: { field_rule: string, direction: "TO_PRIMARY" | "TO_SECONDARY" | "BIDIRECTIONAL" }[]) => {
            updater((prevConfig) => {
                if (!prevConfig) return prevConfig;
                const result: RootConfig = {
                    ...prevConfig,
                    integrationConfig: {
                        ...prevConfig.integrationConfig,
                        integration_module_config:
                            prevConfig.integrationConfig.integration_module_config.map(
                                (moduleConfig) => handleProduct360Fields(moduleConfig, fields)
                            )
                    }
                }
                return result;
            });
        }
    }
}

function updateWarehouse360ModuleConfig(moduleConfig: IntegrationModuleConfig, option: SelectOption): IntegrationModuleConfig {
    if (!isIntegration360ModuleConfig(moduleConfig)) return moduleConfig;
    const result: Integration360ModuleConfig = {
        ...moduleConfig,
        warehouse_config: {
            warehouse_id: option.value
        }
    }
    return result;
}

function toggleFieldSync(moduleConfig: IntegrationModuleConfig): IntegrationModuleConfig {
    if (!isIntegration360ModuleConfig(moduleConfig)) return moduleConfig;
    const result: Integration360ModuleConfig = {
        ...moduleConfig,
        product_360_config: {
            ...moduleConfig.product_360_config,
            sync: !moduleConfig.product_360_config.sync,
        }
    };
    return result;
}

function handleProduct360Fields(moduleConfig: IntegrationModuleConfig, fields: { field_rule: string, direction: "TO_PRIMARY" | "TO_SECONDARY" | "BIDIRECTIONAL" }[]): IntegrationModuleConfig {
    if (!isIntegration360ModuleConfig(moduleConfig)) return moduleConfig;
    const result: Integration360ModuleConfig = {
        ...moduleConfig,
        product_360_config: {
            ...moduleConfig.product_360_config,
            fields,
        }
    };
    return result;
}

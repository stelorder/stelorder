import React, {useContext, useState} from "react";
import {RootContext} from "../../../context/RootContext/RootContext.context.tsx";
import {SelectOption} from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";
import {Button, Form, Icon, integrationsTheme, Modal, SimpleGrid} from "@stelsolutions/stelorder-catalog";

export function ProductSyncModal({fields, updateConfig, isOpen, close}: {
    fields: { field_rule: string, direction: "TO_PRIMARY" | "TO_SECONDARY" | "BIDIRECTIONAL" }[];
    isOpen: boolean;
    close: () => void;
    updateConfig: (config: { field_rule: string, direction: "TO_PRIMARY" | "TO_SECONDARY" | "BIDIRECTIONAL" }[]) => void;
}) {
    const {root} = useContext(RootContext) || {root: document.body};


    const STOCK_OPTIONS = [
        {label: "Stock real de Order", value: "REAL"},
        {label: "Stock virtual de Order", value: "VIRTUAL"},
    ];

    const DEFAULT_DIRECTION = "BIDIRECTIONAL";

    type FieldConfig = {
        enabled: boolean;
        direction: SelectOption | null;
    };
    const STATUS_LABELS: Record<string, string> = {
        name: "Nombre",
        price: "Precio base de venta",
        barcode: "Código de barras",
        "real-stock": "Stock",
        "virtual-stock": "Stock virtual",
        image: "Imagen",
        description: "Descripción",
        sku: "Referencia/SKU",
    };

    const CATEGORY_LABELS: Record<string, string> = {
        BIDIRECTIONAL: "Bidireccional",
        TO_PRIMARY: "De WooCommerce a Order",
        TO_SECONDARY: "De Order a WooCommerce",
    };

    const FIELD_MAP: Record<string, string> = {
        price: "price",
    };

    const buildInitialFieldsConfig = () => {
        const initial: Record<string, FieldConfig> = {};

        // Convertimos infoText a mapa → O(1)
        const infoMap = Object.fromEntries(
            fields.map((f) => [f.field_rule, f]),
        );

        Object.keys(STATUS_LABELS).forEach((key) => {
            if (key === "virtual-stock") return;

            // STOCK
            if (key === "real-stock") {
                const real = infoMap["real-stock"];
                const virtual = infoMap["virtual-stock"];

                initial[key] = {
                    enabled: !!real || !!virtual,
                    direction: {
                        label: virtual ? "Stock virtual de Order" : "Stock real de Order",
                        value: virtual ? "VIRTUAL" : "REAL",
                    },
                };
                return;
            }

            // RESTO
            const field = infoMap[key];

            initial[key] = {
                enabled: !!field,
                direction: {
                    label: CATEGORY_LABELS[field?.direction || DEFAULT_DIRECTION],
                    value: field?.direction || DEFAULT_DIRECTION,
                },
            };
        });

        return initial;
    };

    const [fieldsConfig, setFieldsConfig] = useState(buildInitialFieldsConfig);

    const updateField = (key: string, changes: Partial<FieldConfig>) => {
        setFieldsConfig((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                ...changes,
            },
        }));
    };

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const result: Array<{ field_rule: string; direction: "TO_PRIMARY" | "TO_SECONDARY" | "BIDIRECTIONAL" }> = [];

        Object.entries(fieldsConfig).forEach(([key, config]) => {
            if (!config.enabled) return;

            // STOCK
            if (key === "real-stock") {
                result.push({
                    field_rule:
                        config.direction?.value === "REAL"
                            ? "real-stock"
                            : "virtual-stock",
                    direction: "TO_SECONDARY",
                });
                return;
            }

            result.push({
                field_rule: FIELD_MAP[key] ?? key,
                direction: (config.direction?.value || DEFAULT_DIRECTION) as "TO_PRIMARY" | "TO_SECONDARY" | "BIDIRECTIONAL",
            });
        });

        updateConfig(result);
        console.log(JSON.stringify(result, null, 2));
        close();
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                isCentered={true}
                fade={true}
                animationDurationSec={0.3}
                showIn={root}
                htmlProps={{
                    as: "section",
                    style: {
                        maxWidth: "40vw",
                        minWidth: "550px",
                        padding: "18px",
                    },
                }}
            >
                <Form
                    htmlProps={{
                        onSubmit: handleSubmit,
                    }}
                >
                    <SimpleGrid gap={12}>
                        <SimpleGrid.Item>
                            <SimpleGrid
                                itemsPerLine={2}
                                htmlProps={{ as: "header", style: { paddingBottom: 14 } }}
                            >
                                <SimpleGrid.Item
                                    htmlProps={{
                                        as: "h1",
                                        style: {
                                            flex: "1 0 0",
                                            display: "flex",
                                            textWrap: "wrap",
                                            alignItems: "stretch",
                                            margin: 0,
                                        },
                                        className: "modal-title",
                                    }}
                                >
                    <span
                        style={{
                            ...integrationsTheme.defaults.cardTitle,
                            color: integrationsTheme.colors.orderSecondary.orderSecondary100,
                        }}
                    >
                      Selecciona los campos a sincronizar
                    </span>
                                </SimpleGrid.Item>
                                <SimpleGrid.Item
                                    htmlProps={{ as: "span", style: { flex: "0 0 auto" } }}
                                >
                                    <Icon
                                        variant="close"
                                        htmlProps={{
                                            onClick: () => close(),
                                            style: {
                                                cursor: "pointer",
                                                opacity: 0.5,
                                            },
                                        }}
                                        width="22px"
                                        height="22px"
                                        color="inherit"
                                    />
                                </SimpleGrid.Item>
                            </SimpleGrid>
                        </SimpleGrid.Item>
                        <SimpleGrid.Item>
                            <div
                                style={{
                                    overflowY: "auto",
                                    maxHeight: "50vh",
                                    width: "100%",
                                }}
                            >
                                {Object.entries(STATUS_LABELS)
                                    .filter(([key]) => key !== "virtual-stock")
                                    .map(([category, values], index, array) => {
                                        const isLastThree = index >= array.length - 3;

                                        return (
                                            <SimpleGrid
                                                key={category}
                                                gap={36}
                                                htmlProps={{
                                                    style: {
                                                        alignItems: "center",
                                                        padding: "8px",
                                                        boxSizing: "border-box",
                                                        width: "100%",
                                                        borderBottom: "1px #E9E9ED solid",
                                                    },
                                                }}
                                            >
                                                <SimpleGrid.Item
                                                    htmlProps={{
                                                        style: {
                                                            flex: "1 0 0",
                                                            display: "flex",
                                                            width: "auto",

                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                        },
                                                    }}
                                                >
                            <span
                                style={{
                                    width: "90%",
                                    color:
                                    integrationsTheme.colors.orderSecondary.orderSecondary80,
                                    ...integrationsTheme.fonts.h1400,
                                }}
                            >
                              {values}
                            </span>

                                                    <Form.Group
                                                        htmlProps={{
                                                            style: {
                                                                flexDirection: "row",
                                                                width: "fit-content",
                                                            },
                                                        }}
                                                    >
                                                        <Form.Checkbox
                                                            type="switch"
                                                            isInvalid={false}
                                                            isValid={false}
                                                            id={`${category}-checkbox`}
                                                            htmlProps={{
                                                                disabled: false,
                                                                checked:
                                                                    fieldsConfig[category]?.enabled ?? false,
                                                                "aria-label": `Activar sincronización de ${values}`,
                                                                onChange: (e) => {
                                                                    updateField(category, {
                                                                        enabled: e.currentTarget.checked,
                                                                    });
                                                                },
                                                            }}
                                                        />
                                                    </Form.Group>
                                                </SimpleGrid.Item>
                                                <SimpleGrid.Item
                                                    htmlProps={{
                                                        style: {
                                                            flex: "0 0 auto",
                                                        },
                                                    }}
                                                >
                                                    <Form.Group
                                                        htmlProps={{
                                                            style: { minWidth: "232px" },
                                                        }}
                                                    >
                                                        <Form.Select
                                                            defaultOption={{
                                                                label: "Por defecto",
                                                                value: "",
                                                            }}
                                                            optionValue={
                                                                fieldsConfig[category]?.direction ?? {
                                                                    label: "Por defecto",
                                                                    value: "",
                                                                }
                                                            }
                                                            handleChange={(option: SelectOption) =>
                                                                updateField(category, { direction: option })
                                                            }
                                                            htmlProps={{
                                                                id: `${category}-select`,
                                                                name: `${category}-select`,
                                                                style: { textAlign: "left" },
                                                                "aria-label": `Dirección de sincronización para ${values}`, // Soluciona el error A11Y
                                                            }}
                                                            //Los tres ultimos tengan el select top
                                                            boxPosition={isLastThree ? "top" : "bottom"}
                                                            options={
                                                                category === "real-stock"
                                                                    ? STOCK_OPTIONS
                                                                    : Object.entries(CATEGORY_LABELS).map(
                                                                        ([key, label]) => ({
                                                                            label,
                                                                            value: key,
                                                                        }),
                                                                    )
                                                            }
                                                        />
                                                    </Form.Group>
                                                </SimpleGrid.Item>
                                            </SimpleGrid>
                                        );
                                    })}
                            </div>
                        </SimpleGrid.Item>
                        <SimpleGrid.Item htmlProps={{ style: { paddingTop: 20 } }}>
                            <Button
                                variant="secondary"
                                size="xl"
                                htmlProps={{ style: { width: "100%" }, type: "submit" }}
                            >
                                Guardar
                            </Button>
                        </SimpleGrid.Item>
                    </SimpleGrid>
                </Form>
            </Modal>
        </>
    );
}
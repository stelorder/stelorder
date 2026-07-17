import {ReactElement, useContext, useEffect, useMemo, useRef, useState} from "react";
import {
  AdviceBlock,
  Button,
  Card,
  Form,
  Icon,
  Image,
  IntegrationsThemeType,
  Modal,
  SelectCard,
  SimpleGrid, Spinner,
  Status,
  Title,
} from "@stelsolutions/stelorder-catalog";

import {useTheme} from "styled-components";
import {RootContext} from "../context/RootContext/RootContext.context";
import LogoAlejandra from "../assets/images/STEL_Alejandra.png";
import {getBaseUrl} from "../utils/url";
import {useLoaderFetcher} from "../hooks/useLoaderFetcher";
import {
  AvailableIntegrationConfig, isIntegration360ModuleConfig, isIntegration360ModuleConfigAvailable,
  RootConfig,
  SerialNumber,
  useFetchConfiguration,
} from "../hooks/useFetchConfiguration";
import {useUpdateIntegrationConfig} from "../hooks/useUpdateIntegrationConfig";
import {ErrorModal} from "../components/ErrorModal/ErrorModal";
import {SelectSyncStatusModal} from "../components/SelectSyncStatusModal/SelectSyncStatusModal";
import {useWpApiSettings} from "../hooks/useWpApiSettings";
import {useNavigate} from "react-router-dom";
import {AccountStatus, accountStatusUI} from "../utils/types";
import {capitalizeFirstLetter} from "./utils/page-utils";
import {useTranslation} from "react-i18next";
import {ProductConfig} from "../components/360/ProductConfig/ProductConfig.tsx";
import SerialNumberUtils from "../utils/SerialNumberUtils.ts";
import {SelectOption} from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";

const invoiceLocationLabel = {
  NONE: (func: (key: string) => string) => func("invoices_section.location.none"),
  EMAIL: (func: (key: string) => string) => func("invoices_section.location.email"),
};

function fetchAvailableConfigSn({
                                  data,
                                  supplier,
                                }: {
  data: AvailableIntegrationConfig;
  supplier: (data: AvailableIntegrationConfig) => SerialNumber[] | undefined;
}): SelectOption | undefined {
  const availableSns = supplier(data);
  const availableSn = availableSns?.find((sn) => sn.default === true);
  if (!availableSn) return undefined;
  return {
    label: `${availableSn.name} (${availableSn.prefix})`,
    value: `${availableSn.id}`,
  };
}

type DefaultSnOptions = {
  defaultOptionOrdersn: SelectOption | undefined;
  defaultOptionInvoicesn: SelectOption | undefined;
  defaultOptionClientsn: SelectOption | undefined;
  defaultOptionProductsn: SelectOption | undefined;
  defaultOptionRefundInvoicesn: SelectOption | undefined;
};

function fetchDefaultSnOptions({
                                 data,
                               }: {
  data: RootConfig;
}): DefaultSnOptions {
  const defaultOptionOrdersn = fetchAvailableConfigSn({
    data: data.availableIntegrationConfig,
    supplier: (data) =>
        data.available_sales_order_config.salesOrderSerialNumbers,
  });
  const defaultOptionInvoicesn = fetchAvailableConfigSn({
    data: data.availableIntegrationConfig,
    supplier: (data) =>
        data.available_ordinary_invoice_config.ordinaryInvoiceSerialNumbers,
  });
  const defaultOptionClientsn = fetchAvailableConfigSn({
    data: data.availableIntegrationConfig,
    supplier: (data) => data.available_client_config.clientSerialNumbers,
  });
  const defaultOptionProductsn = fetchAvailableConfigSn({
    data: data.availableIntegrationConfig,
    supplier: (data) => data.available_product_config.productSerialNumbers,
  });
  const defaultOptionRefundInvoicesn = fetchAvailableConfigSn({
    data: data.availableIntegrationConfig,
    supplier: (data) =>
        data.available_refund_invoice_config.refundInvoiceSerialNumbers,
  });

  return {
    defaultOptionOrdersn,
    defaultOptionInvoicesn,
    defaultOptionClientsn,
    defaultOptionProductsn,
    defaultOptionRefundInvoicesn,
  };
}


// ...existing code...
function applyRefOptionsFromData(
    data: RootConfig,
    setters: {
      setRefOrder: (opt: SelectOption | undefined) => void;
      setRefInvoice: (opt: SelectOption | undefined) => void;
      setRefProduct: (opt: SelectOption | undefined) => void;
      setRefClient: (opt: SelectOption | undefined) => void;
      setRefRefundInvoice: (opt: SelectOption | undefined) => void;
      setRefWarehouse: (opt: SelectOption | undefined) => void;
    }
) {
  const {
    setRefOrder,
    setRefInvoice,
    setRefProduct,
    setRefClient,
    setRefRefundInvoice,
    setRefWarehouse,
  } = setters;

  setRefOrder(
      SerialNumberUtils.fetchSnOption({
        snId: data.integrationConfig.sales_order_config
            .serial_number_sales_order_id,
        sns: data.availableIntegrationConfig.available_sales_order_config
            .salesOrderSerialNumbers,
      })
  );

  setRefInvoice(
      SerialNumberUtils.fetchSnOption({
        snId: data.integrationConfig.ordinary_invoice_config
            .serial_number_ordinary_invoice_id,
        sns: data.availableIntegrationConfig.available_ordinary_invoice_config
            .ordinaryInvoiceSerialNumbers,
      })
  );

  setRefProduct(
      SerialNumberUtils.fetchSnOption({
        snId: data.integrationConfig.product_config.serial_number_product_id,
        sns: data.availableIntegrationConfig.available_product_config
            .productSerialNumbers,
      })
  );

  setRefClient(
      SerialNumberUtils.fetchSnOption({
        snId: data.integrationConfig.client_config.serial_number_client_id,
        sns: data.availableIntegrationConfig.available_client_config
            .clientSerialNumbers,
      })
  );

  setRefRefundInvoice(
      SerialNumberUtils.fetchSnOption({
        snId: data.integrationConfig.refund_invoice_config
            .serial_number_refund_invoice_id,
        sns: data.availableIntegrationConfig.available_refund_invoice_config
            .refundInvoiceSerialNumbers,
      })
  );

  setRefWarehouse(SerialNumberUtils.fetchSnOption({
    snId: Number(data.integrationConfig.warehouse_config.warehouse_id) || null,
    sns: data.availableIntegrationConfig.available_warehouse_config.warehouses?.map((wh) => ({
      id: Number(wh.id),
      name: wh.name,
      prefix: "",
      default: false,
    })) || [],
  }));
}


export default function ConfigPage() {
  const { stelUrl } = useWpApiSettings();
  const navigate = useNavigate();

  const { root } = useContext(RootContext) || { root: document.body };

  const [defaultSnOptions, setDefaultSnOptions] = useState<DefaultSnOptions>({
    defaultOptionOrdersn: undefined,
    defaultOptionInvoicesn: undefined,
    defaultOptionClientsn: undefined,
    defaultOptionProductsn: undefined,
    defaultOptionRefundInvoicesn: undefined,
  });

  const [verifactuEstado, setVerifactuEstado] = useState<
      "pendiente" | "aceptada"
  >("pendiente");
  const [verifactuSiSelected, setVerifactuSiSelected] =
      useState<boolean>(false);
  const [verifactuNoSelected, setVerifactuNoSelected] =
      useState<boolean>(false);
  const [openSalesOrderStateModal, setOpenSalesOrderStateModal] =
      useState<boolean>(false);
  const [openOrdinaryInvoiceStateModal, setOpenOrdinaryInvoiceStateModal] =
      useState<boolean>(false);

  const [open, setOpen] = useState(false);
  const [openErrorModal, setOpenErrorModal] = useState<boolean>(false);

  const [refProduct, setRefProduct] = useState<SelectOption | undefined>();

  const [refClient, setRefClient] = useState<SelectOption | undefined>();

  const [warehouse, setRefWarehouse] = useState<SelectOption | undefined>();
  const [refOrder, setRefOrder] = useState<SelectOption | undefined>();
  const [refInvoice, setRefInvoice] = useState<SelectOption | undefined>();
  const [refRefundInvoice, setRefRefundInvoice] = useState<
      SelectOption | undefined
  >();
  const [sendEmail, setSendEmail] = useState<SelectOption | undefined>();

  const [isEditing, setIsEditing] = useState(false);
  const isDisabled = useMemo(() => !isEditing, [isEditing]);

  const theme = useTheme() as IntegrationsThemeType;
  const LogoAgencia = useMemo(
      () => Icon.Utils.LazyIcon("helpAgenciaTributaria"),
      []
  );

  const { t: errorTranslation } = useTranslation("error");
  const { t: configTranslation } = useTranslation("configuration");

  const {
    data,
    handleData,
    isLoading: isLoadingData,
  } = useLoaderFetcher({
    useFetchElement: useFetchConfiguration,
    onComplete: (data) => {
      if (!data) return;
      setDefaultSnOptions(fetchDefaultSnOptions({ data }));
      applyRefOptionsFromData(data, {
        setRefOrder,
        setRefInvoice,
        setRefProduct,
        setRefClient,
        setRefRefundInvoice,
        setRefWarehouse,
      });
      setVerifactuEstado(
          data.verifactuConfig["verifactu-enabled"] ? "aceptada" : "pendiente"
      );
      setVerifactuSiSelected(data.verifactuConfig["yes-verifactu-enabled"]);
      setVerifactuNoSelected(data.verifactuConfig["no-verifactu-enabled"]);
    },
    onError: () => {
      navigate("/error");
    },
  });

  const defaultOptionWarehouse = useMemo(() => {
    const defaultOption =
        data?.availableIntegrationConfig?.available_warehouse_config.warehouses?.find(
            (wh) => wh.id === "-2"
        );
    if (!defaultOption) return undefined;
    return {
      label: `${defaultOption.name}`,
      value: defaultOption.id,
    };
  }, [data?.availableIntegrationConfig?.available_warehouse_config.warehouses]);

  useEffect(() => {
    console.log(data);
  }, [data]);

  const { isLoadingSubmit, submitUpdateIntegrationConfig } =
      useUpdateIntegrationConfig({
        data: data ?? undefined,
        onComplete: (data) => {
          setOpen(true);
          handleData(data);
          setTimeout(() => {
            setOpen(false);
            setIsEditing(false);
          }, 1500);
        },
        onError: () => {
          setOpenErrorModal(true);
        },
      });

  const formRef = useRef<HTMLFormElement>(null);

  const editIconColor = theme?.colors?.orderSecondary?.orderSecondary70;
  const EditIcon = useRef(<Icon variant="edit" color={editIconColor} />);

  return (
      <>
        {isLoadingData && (
            <div
                style={{
                  height: "100vh",
                  textAlign: "center",
                  alignContent: "center",
                }}
            >
              <Spinner size={48} />
            </div>
        )}
        {!isLoadingData && data && (
            <Form
                notHandleValidation={true}
                htmlProps={{
                  ref: formRef,
                  onSubmit: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    submitUpdateIntegrationConfig();
                  },
                  style: {
                    paddingTop: "12px",
                    paddingRight: "20px",
                    paddingLeft: "20px",
                    paddingBottom: "20px",
                  },
                }}
            >
              <SimpleGrid alignX="center" alignY="start" gap={10} itemsPerLine={1}>
                <SimpleGrid.Item col={1}>
                  <SimpleGrid gap={8} itemsPerLine={2} alignX="between">
                    <SimpleGrid.Item col="auto">
                      <Button
                          variant="white"
                          size="l"
                          htmlProps={{
                            style: { display: !isEditing ? "block" : "none" },
                            disabled: isLoadingSubmit || isLoadingData,
                            onClick: () => setIsEditing(true),
                            type: "button",
                          }}
                      >
                        {configTranslation("header.btn.edit_btn")}
                        {" "}
                        {EditIcon.current}
                      </Button>
                      <Button
                          htmlProps={{
                            style: { display: isEditing ? "block" : "none" },
                            onClick: async () => {
                              formRef.current?.dispatchEvent(
                                  new Event("submit", {
                                    cancelable: true,
                                    bubbles: true,
                                  })
                              );
                            },
                            type: "button",
                            disabled: isLoadingSubmit || isLoadingData,
                          }}
                          size="l"
                          variant={isEditing ? "secondary" : "white"}
                      >
                        {
                          isLoadingSubmit
                              ? configTranslation("header.btn.loading_btn")
                              : configTranslation("header.btn.save_btn")
                        }
                      </Button>
                    </SimpleGrid.Item>
                    <SimpleGrid.Item col="auto">
                      <Status
                          gap={6}
                          label=""
                          order={{ icon: 1, label: 0, text: 2 }}
                          status={
                            accountStatusUI[
                                capitalizeFirstLetter(
                                    data.integrationConfig.integration_status.toLowerCase()
                                ) as AccountStatus
                                ].statusVariant
                          }
                          statusText={
                            accountStatusUI[
                                capitalizeFirstLetter(
                                    data.integrationConfig.integration_status.toLowerCase()
                                ) as AccountStatus
                                ].statusText(configTranslation)
                          }
                      />
                    </SimpleGrid.Item>
                  </SimpleGrid>
                </SimpleGrid.Item>

                <SimpleGrid.Item col={1}>
                  <Card htmlProps={{ style: { boxSizing: "border-box" } }}>
                    <SimpleGrid gap={20} itemsPerLine={1} direction="column">
                      <SimpleGrid.Item col={1}>
                        <ProductConfig isDisabled={isDisabled} config={
                          (() => {
                            const integration360Config = data.integrationConfig.integration_module_config.find(
                                (m) => isIntegration360ModuleConfig(m)
                            );
                            if (!integration360Config) return undefined;
                            const available360Config = data.availableIntegrationConfig.available_integration_module_config.find(
                                (m) => isIntegration360ModuleConfigAvailable(m)
                            );
                            if (!available360Config) return undefined;
                            return {
                              ...integration360Config,
                              available_360_module_config: available360Config,
                              updateIntegrationConfig: handleData,
                            }
                          })()
                        }  />
                      </SimpleGrid.Item>
                      <SimpleGrid.Item col={1}>
                        <SimpleGrid gap={10} itemsPerLine={2} direction="row">
                          <SimpleGrid.Item col={2}>
                            <Title
                                htmlProps={{ as: "h1" }}
                                textAlign="left"
                                variant="default"
                            >
                              {configTranslation("orders_section.title")}
                            </Title>
                          </SimpleGrid.Item>

                          <SimpleGrid.Item col={2}>
                            <Form.Group>
                                <Form.Checkbox
                                    label={configTranslation("orders_section.auto_sync_toggle")}
                                    type="switch"
                                    isInvalid={false}
                                    isValid={false}
                                    id="order-checkbox"
                                    labelPosition="left"
                                    labelGap={12}
                                    htmlProps={{
                                        disabled: isDisabled,
                                        checked:
                                            data?.legacyOrderSyncSubscription &&
                                            data.integrationConfig.sales_order_config.sync,
                                        onChange: (e) => {
                                            console.log("entra", e)
                                            if (isDisabled) return;
                                            handleData((prev) => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    integrationConfig: {
                                                        ...prev.integrationConfig,
                                                        sales_order_config: {
                                                            ...prev.integrationConfig
                                                                .sales_order_config,
                                                            sync: !prev.integrationConfig
                                                                .sales_order_config.sync,
                                                        },
                                                    },
                                                    legacyOrderSyncSubscription: {
                                                        ...prev.legacyOrderSyncSubscription,
                                                        sync:
                                                            !prev.integrationConfig
                                                                .ordinary_invoice_config.sync &&
                                                            !prev.integrationConfig
                                                                .sales_order_config.sync === false
                                                                ? false
                                                                : true,
                                                    },
                                                };
                                            });
                                        },
                                    }}
                                />
                            </Form.Group>
                          </SimpleGrid.Item>

                          <SimpleGrid.Item col={2}>
                            <SimpleGrid gap={20} itemsPerLine={2} htmlProps={{ style: { width: "100%" }}}>
                              <SimpleGrid.Item col={1}>
                                <Form.Group
                                    htmlProps={{
                                      style: { textAlign: "left" },
                                    }}
                                >
                                  <Form.Label
                                      htmlProps={{
                                        htmlFor: "refOrder",
                                        style: {
                                          textAlign: "left",
                                          color:
                                          theme.colors.orderSecondary.orderSecondary80,
                                        },
                                      }}
                                  >
                                    {configTranslation("orders_section.reference_label")}
                                  </Form.Label>
                                  <Form.Select
                                      defaultOption={
                                          (defaultSnOptions.defaultOptionOrdersn as SelectOption) || {
                                            label: configTranslation("by_default"),
                                            value: "",
                                          }
                                      }
                                      optionValue={refOrder}
                                      handleChange={(opt) => {
                                        console.log("Cambio refOrder:", opt);
                                        handleData((prev) => {
                                          if (!prev) return prev;
                                          setRefOrder(opt);
                                          return {
                                            ...prev,
                                            integrationConfig: {
                                              ...prev.integrationConfig,
                                              sales_order_config: {
                                                ...prev.integrationConfig
                                                    .sales_order_config,
                                                serial_number_sales_order_id:
                                                    (opt?.value && Number(opt.value)) ||
                                                    null,
                                              },
                                            },
                                          };
                                        });
                                      }}
                                      htmlProps={{
                                        id: "refOrder",
                                        name: "refOrder",
                                        style: {
                                          textAlign: "left",
                                          boxSizing: "border-box",
                                        },
                                        disabled: isDisabled,
                                      }}
                                      options={[
                                        ...(SerialNumberUtils.mapSnOptions(
                                            data?.availableIntegrationConfig
                                                .available_sales_order_config
                                                .salesOrderSerialNumbers
                                        ) || []),
                                      ]}
                                  />
                                </Form.Group>
                              </SimpleGrid.Item>

                              <SimpleGrid.Item col={1}>
                                <Form.Group
                                    htmlProps={{
                                      style: { height: "100%" },
                                    }}
                                >
                                  <Form.Label
                                      htmlProps={{
                                        style: {
                                          textAlign: "left",
                                          color:
                                          theme.colors.orderSecondary.orderSecondary80,
                                        },
                                      }}
                                  >
                                    {configTranslation("orders_section.sync_status_label")}
                                  </Form.Label>
                                  <Button
                                      variant="gray"
                                      htmlProps={{
                                        style: { width: "fit-content", height: "100%" },
                                        disabled: isDisabled,
                                        type: "button",
                                        onClick: () => {
                                          setOpenSalesOrderStateModal(true);
                                        },
                                      }}
                                  >
                                    {configTranslation("orders_section.sync_placeholder")}
                                  </Button>
                                </Form.Group>
                              </SimpleGrid.Item>
                            </SimpleGrid>
                          </SimpleGrid.Item>
                        </SimpleGrid>
                      </SimpleGrid.Item>

                      <SimpleGrid.Item col={1}>
                        <SimpleGrid gap={8} itemsPerLine={2} direction="row">
                          <SimpleGrid.Item col={2}>
                            <Title
                                htmlProps={{ as: "h1" }}
                                textAlign="left"
                                variant="default"
                            >
                              {configTranslation("invoices_section.title")}
                            </Title>
                          </SimpleGrid.Item>

                          <SimpleGrid.Item col={2}>
                            <Form.Group
                                htmlProps={{
                                  style: { textAlign: "left" },
                                }}
                            >
                              <Form.Checkbox
                                  label={configTranslation("invoices_section.auto_sync_toggle")}
                                  type="switch"
                                  isInvalid={false}
                                  isValid={false}
                                  id="invoice-checkbox"
                                  labelPosition="left"
                                  labelGap={12}
                                  htmlProps={{
                                      disabled: isDisabled,
                                      checked:
                                          data?.legacyOrderSyncSubscription &&
                                          data.integrationConfig.ordinary_invoice_config
                                              .sync,
                                      onChange: () => {
                                          if (isDisabled) return;
                                          handleData((prev) => {
                                              if (!prev) return prev;
                                              console.log(
                                                  !prev.integrationConfig
                                                      .ordinary_invoice_config.sync === false,
                                                  !prev.integrationConfig.sales_order_config
                                                      .sync
                                              );
                                              return {
                                                  ...prev,
                                                  integrationConfig: {
                                                      ...prev.integrationConfig,
                                                      ordinary_invoice_config: {
                                                          ...prev.integrationConfig
                                                              .ordinary_invoice_config,
                                                          sync: !prev.integrationConfig
                                                              .ordinary_invoice_config.sync,
                                                      },
                                                  },
                                                  legacyOrderSyncSubscription: {
                                                      ...prev.legacyOrderSyncSubscription,
                                                      sync:
                                                          !prev.integrationConfig
                                                              .sales_order_config.sync &&
                                                          !prev.integrationConfig
                                                              .ordinary_invoice_config.sync ===
                                                          false
                                                              ? false
                                                              : true,
                                                  },
                                              };
                                          });
                                      },
                                  }}
                              />
                            </Form.Group>
                          </SimpleGrid.Item>

                          <SimpleGrid.Item col={2}>
                            <SimpleGrid itemsPerLine={2} gap={20}>
                              <SimpleGrid.Item col={1}>
                                <Form.Group
                                    htmlProps={{
                                      style: { textAlign: "left" },
                                    }}
                                >
                                  <Form.Label
                                      htmlProps={{
                                        htmlFor: "refInvoice",
                                        style: {
                                          textAlign: "left",
                                          color:
                                          theme.colors.orderSecondary.orderSecondary80,
                                        },
                                      }}
                                  >
                                    {
                                      configTranslation("invoices_section.reference_label")
                                    }
                                  </Form.Label>
                                  <Form.Select
                                      defaultOption={
                                          (defaultSnOptions.defaultOptionInvoicesn as SelectOption) || {
                                            label: configTranslation("by_default"),
                                            value: "",
                                          }
                                      }
                                      optionValue={refInvoice}
                                      handleChange={(opt) => {
                                        handleData((prev) => {
                                          if (!prev) return prev;
                                          setRefInvoice(opt);
                                          return {
                                            ...prev,
                                            integrationConfig: {
                                              ...prev.integrationConfig,
                                              ordinary_invoice_config: {
                                                ...prev.integrationConfig.ordinary_invoice_config,
                                                serial_number_ordinary_invoice_id: (opt?.value && Number(opt.value)) || null,
                                              },
                                            },
                                          }
                                        })
                                      }}
                                      htmlProps={{
                                        disabled: isDisabled,
                                        id: "refInvoice",
                                        name: "refInvoice",
                                        style: {
                                          textAlign: "left",
                                          boxSizing: "border-box",
                                        },
                                      }}
                                      options={[
                                        ...(SerialNumberUtils.mapSnOptions(
                                            data?.availableIntegrationConfig
                                                .available_ordinary_invoice_config
                                                .ordinaryInvoiceSerialNumbers
                                        ) || []),
                                      ]}
                                  />
                                </Form.Group>
                              </SimpleGrid.Item>
                              <SimpleGrid.Item col={1}>
                                <Form.Group
                                    htmlProps={{
                                      style: { textAlign: "left" },
                                    }}
                                >
                                  <Form.Label
                                      htmlProps={{
                                        htmlFor: "refRefundInvoice",
                                        style: {
                                          textAlign: "left",
                                          color:
                                          theme.colors.orderSecondary.orderSecondary80,
                                        },
                                      }}
                                  >
                                    {configTranslation("invoices_section.refund_reference_label")}
                                  </Form.Label>
                                  <Form.Select
                                      defaultOption={
                                          (defaultSnOptions.defaultOptionRefundInvoicesn as SelectOption) || {
                                            label: configTranslation("by_default"),
                                            value: "",
                                          }
                                      }
                                      optionValue={refRefundInvoice}
                                      handleChange={(opt) => {
                                        handleData((prev) => {
                                          if (!prev) return prev;
                                          setRefRefundInvoice(opt);
                                          return {
                                            ...prev,
                                            integrationConfig: {
                                              ...prev.integrationConfig,
                                              refund_invoice_config: {
                                                ...prev.integrationConfig.refund_invoice_config,
                                                serial_number_refund_invoice_id: (opt?.value && Number(opt.value)) || null,
                                              },
                                            }
                                          }
                                        });
                                      }}
                                      htmlProps={{
                                        disabled: isDisabled,
                                        id: "refRefundInvoice",
                                        name: "refRefundInvoice",
                                        style: {
                                          textAlign: "left",
                                        },
                                      }}
                                      options={[
                                        ...(SerialNumberUtils.mapSnOptions(
                                            data?.availableIntegrationConfig
                                                .available_refund_invoice_config
                                                .refundInvoiceSerialNumbers
                                        ) || []),
                                      ]}
                                  />
                                </Form.Group>
                              </SimpleGrid.Item>
                            </SimpleGrid>
                          </SimpleGrid.Item>
                          {/* TODO revisar este componente */}
                          <SimpleGrid.Item col={2}>
                            <SimpleGrid gap={20} itemsPerLine={2}>
                              <SimpleGrid.Item col={1}>
                                <Form.Group
                                    htmlProps={{
                                      style: { textAlign: "left" },
                                    }}
                                >
                                  <Form.Label
                                      htmlProps={{
                                        htmlFor: "sendEmail",
                                        style: {
                                          textAlign: "left",
                                          color:
                                          theme.colors.orderSecondary
                                              .orderSecondary80,
                                        },
                                      }}
                                  >
                                    {configTranslation("invoices_section.send_method_label")}
                                  </Form.Label>
                                  <Form.Select
                                      defaultOption={{
                                        label:
                                            invoiceLocationLabel[
                                                data?.integrationConfig?.document_config
                                                    ?.invoice_location as keyof typeof invoiceLocationLabel
                                                ](configTranslation) || configTranslation("invoices_section.location.none"),
                                        value:
                                            data?.integrationConfig?.document_config
                                                ?.invoice_location || "NONE",
                                      }}
                                      optionValue={sendEmail}
                                      handleChange={(opt) => {
                                        handleData((prev) => {
                                          if (!prev) return prev;
                                          setSendEmail(opt);
                                          return {
                                            ...prev,
                                            integrationConfig: {
                                              ...prev.integrationConfig,
                                              document_config: {
                                                ...prev.integrationConfig
                                                    .document_config,
                                                invoice_location:
                                                    (opt?.value as string) || "NONE",
                                              },
                                            },
                                          };
                                        });
                                      }}
                                      htmlProps={{
                                        disabled: isDisabled,
                                        id: "sendEmail",
                                        name: "sendEmail",
                                        style: {
                                          textAlign: "left",
                                        },
                                      }}
                                      options={
                                          data?.availableIntegrationConfig.available_document_config.invoiceLocation?.map(
                                              (location) => ({
                                                label:
                                                    invoiceLocationLabel[
                                                        location as keyof typeof invoiceLocationLabel
                                                        ](configTranslation),
                                                value: location,
                                              })
                                          ) || []
                                      }
                                  />
                                </Form.Group>
                              </SimpleGrid.Item>

                              <SimpleGrid.Item col={1}>
                                <Form.Group
                                    htmlProps={{
                                      style: { textAlign: "left", height: "100%" },
                                    }}
                                >
                                  <Form.Label
                                      htmlProps={{
                                        style: {
                                          textAlign: "left",
                                          color:
                                          theme.colors.orderSecondary
                                              .orderSecondary80,
                                        },
                                      }}
                                  >
                                    {configTranslation("invoices_section.sync_status_label")}
                                  </Form.Label>
                                  <Button
                                      variant="gray"
                                      htmlProps={{
                                        style: {
                                          width: "fit-content",
                                          height: "100%",
                                        },
                                        disabled: isDisabled,
                                        type: "button",
                                        onClick: () => {
                                          setOpenOrdinaryInvoiceStateModal(true);
                                        },
                                      }}
                                  >
                                    {configTranslation("invoices_section.sync_placeholder")}
                                  </Button>
                                </Form.Group>
                              </SimpleGrid.Item>

                              <SimpleGrid.Item col={1}>
                                <Card
                                    htmlProps={{
                                      style: {
                                        padding: "28px 12px 16px 12px",
                                        boxSizing: "border-box",
                                      },
                                    }}
                                >
                                  <SimpleGrid gap={20} itemsPerLine={2}>
                                    <SimpleGrid.Item col={"auto"}>
                                      <div
                                          style={{
                                            padding: "17.8px 12.46px 20.47px 15.13px",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            borderRadius: "89px",
                                            border:
                                                "3px solid var(--Azul-5, #F2F6FC)",
                                            background: "var(--Azul-20, #CCDBF2)",
                                          }}
                                      >
                                        <Icon
                                            variant="ModoAislamiento"
                                            width="61.41px"
                                            height="50.73px"
                                            color="inherit"
                                        />
                                      </div>
                                    </SimpleGrid.Item>
                                    <SimpleGrid.Item
                                        htmlProps={{
                                          style: {
                                            flex: "1 0 0",
                                            textAlign: "left",
                                          },
                                        }}
                                    >
                                      <SimpleGrid
                                          direction="column"
                                          gap={10}
                                          htmlProps={{
                                            style: {
                                              paddingTop: "10px",
                                            },
                                          }}
                                      >
                                        <SimpleGrid.Item col={1}>
                                      <span
                                          style={{
                                            textAlign: "left",
                                            ...theme.fonts.h1500,
                                            color:
                                            theme.colors.orderSecondary
                                                .orderSecondary70,
                                          }}
                                      >
                                        {configTranslation("invoices_section.templates_card.text")}
                                      </span>
                                        </SimpleGrid.Item>
                                        <SimpleGrid.Item col={1}>
                                          <Button
                                              variant="gray"
                                              size="m"
                                              htmlProps={{ as: "a", href: `${stelUrl}/#deepLink=pdfTemplate`, target: "_blank" } }
                                          >
                                            {configTranslation("invoices_section.templates_card.button")}
                                          </Button>
                                        </SimpleGrid.Item>
                                      </SimpleGrid>
                                    </SimpleGrid.Item>
                                  </SimpleGrid>
                                </Card>
                              </SimpleGrid.Item>
                            </SimpleGrid>
                          </SimpleGrid.Item>
                        </SimpleGrid>
                      </SimpleGrid.Item>

                      <SimpleGrid.Item col={1}>
                        <SimpleGrid gap={8} itemsPerLine={2}>
                          <SimpleGrid.Item
                              col={2}
                              htmlProps={{
                                style: {
                                  display: "flex",
                                },
                              }}
                          >
                            <Form.Group
                                htmlProps={{
                                  style: {
                                    width: "auto",
                                    textAlign: "left",
                                    alignSelf: "center",
                                  },
                                }}
                            >
                              <Form.Checkbox
                                  label="Verifactu:"
                                  type="switch"
                                  isInvalid={false}
                                  isValid={false}
                                  id="verifactu-checkbox"
                                  labelPosition="left"
                                  labelGap={12}
                                  htmlProps={{
                                    disabled: isDisabled,
                                    checked:
                                    data?.integrationConfig.verifactu_config
                                        .check_verifactu,
                                    onChange: (
                                        e: React.ChangeEvent<HTMLInputElement>
                                    ) => {
                                      if (isDisabled) return;
                                      handleData((prev) => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          integrationConfig: {
                                            ...prev.integrationConfig,
                                            verifactu_config: {
                                              ...prev.integrationConfig
                                                  .verifactu_config,
                                              check_verifactu: e.target.checked,
                                            },
                                          },
                                        };
                                      });
                                    },
                                  }}
                              />
                            </Form.Group>
                            {data.integrationConfig.verifactu_config
                                .check_verifactu && (
                                <>
                                  <div
                                      style={{
                                        height: "20px",
                                        padding: "6px 0",
                                        alignItems: "center",
                                        gap: "2px",
                                      }}
                                  >
                                    <hr
                                        style={{
                                          display: "-webkit-box",
                                          WebkitBoxOrient: "vertical",
                                          WebkitLineClamp: 1,
                                          overflow: "hidden",
                                          color: " #A9A9B6",
                                          fontFeatureSettings: "'liga' off",
                                          textOverflow: "ellipsis",
                                          fontFamily: "Roboto",
                                          fontSize: "var(--Tipografa-h1, 14px)",
                                          fontStyle: "normal",
                                          fontWeight: 500,
                                          lineHeight: "140%",
                                          maxHeight: "20px",
                                          height: 100,
                                          background: "none",
                                          border: "none",
                                          width: "1px",
                                          minWidth: "1px",
                                          margin: "0 16px",
                                          backgroundColor:
                                              "var(--Order-Secondary-40, #A9A9B6)",
                                        }}
                                    />
                                  </div>
                                  <Status
                                      gap={6}
                                      label={configTranslation("verifactu_section.status_label")}
                                      order={{
                                        icon: 1,
                                        label: 0,
                                        text: 2,
                                      }}
                                      status={
                                        verifactuEstado === "pendiente"
                                            ? "warning"
                                            : "success"
                                      }
                                      statusText={
                                        verifactuEstado === "pendiente"
                                            ? configTranslation("verifactu_section.status_pending")
                                            : configTranslation("verifactu_section.status_verified")
                                      }
                                  />
                                </>
                            )}
                          </SimpleGrid.Item>
                          <>
                            {data.integrationConfig.verifactu_config.check_verifactu
                                ? ((
                                    <SimpleGrid
                                        itemsPerLine={2}
                                        gap={20}
                                        htmlProps={{
                                          style: {
                                            textAlign: "left",
                                            alignItems: "center",
                                          },
                                        }}
                                    >
                                      <>
                                        {verifactuEstado === "pendiente" ? (
                                            ((
                                                <SimpleGrid.Item col={1}>
                                                  <SimpleGrid gap={10}>
                                                    <SimpleGrid.Item>
                                                      <SimpleGrid gap={6}>
                                                        <SimpleGrid.Item>
                                                <span
                                                    style={{
                                                      color:
                                                      theme.colors
                                                          .orderSecondary
                                                          .orderSecondary100,
                                                      ...theme.fonts.h1500,
                                                    }}
                                                >
                                                  {configTranslation("verifactu_section.auth_card.title")}
                                                </span>
                                                        </SimpleGrid.Item>
                                                        <SimpleGrid.Item>
                                                <span
                                                    style={{
                                                      color:
                                                      theme.colors
                                                          .orderSecondary
                                                          .orderSecondary70,
                                                      ...theme.fonts.h1400,
                                                    }}
                                                >
                                                  {configTranslation("verifactu_section.auth_card.description_part1")}
                                                  <strong>B73684292</strong> {
                                                  configTranslation("verifactu_section.auth_card.description_part2")
                                                }
                                                </span>
                                                        </SimpleGrid.Item>
                                                      </SimpleGrid>
                                                    </SimpleGrid.Item>
                                                    <SimpleGrid.Item>
                                                      <SimpleGrid
                                                          gap={10}
                                                          itemsPerLine={2}
                                                      >
                                                        <SimpleGrid.Item>
                                                          <Button
                                                              variant="primary"
                                                              size="l"
                                                              htmlProps={{
                                                                style: {
                                                                  width: "100%",
                                                                  display: "flex",
                                                                  justifyContent: "center",
                                                                  alignItems: "center",
                                                                },
                                                                as: "a",
                                                                href: "https://sede.agenciatributaria.gob.es/Sede/procedimientoini/ZP01.shtml",
                                                                target: "_blank",
                                                              }}
                                                          >
                                                            <Icon
                                                                variant="agenciaTributaria"
                                                                width="16px"
                                                                height="16px"
                                                                color="inherit"
                                                                htmlProps={{
                                                                  style: {
                                                                    marginRight: "4px",
                                                                  },
                                                                }}
                                                            />
                                                            {
                                                              configTranslation("verifactu_section.auth_card.authorize_btn")
                                                            }
                                                          </Button>
                                                        </SimpleGrid.Item>
                                                        <SimpleGrid.Item>
                                                          <Button
                                                              variant="white"
                                                              size="l"
                                                              htmlProps={{
                                                                style: {
                                                                  width: "100%",
                                                                  display: "flex",
                                                                  justifyContent: "center",
                                                                },
                                                                as: "a",
                                                                href: "https://app-stg.stelorder.com/app/documentos/guia-autorizacion-verifactu.pdf",
                                                                target: "_blank",
                                                              }}
                                                          >
                                                            {
                                                              configTranslation("verifactu_section.auth_card.download_guide_btn")
                                                            }
                                                          </Button>
                                                        </SimpleGrid.Item>

                                                        <SimpleGrid.Item col={2}>
                                                          <AdviceBlock variant="info">
                                                  <span>
                                                    <span
                                                        style={{
                                                          fontWeight: "500",
                                                        }}
                                                    >
                                                      {configTranslation("verifactu_section.auth_card.note_part1")}
                                                    </span>
                                                    <span>
                                                      {" "}
                                                      {configTranslation("verifactu_section.auth_card.note_part2")}
                                                    </span>
                                                  </span>
                                                          </AdviceBlock>
                                                        </SimpleGrid.Item>
                                                      </SimpleGrid>
                                                    </SimpleGrid.Item>
                                                  </SimpleGrid>
                                                </SimpleGrid.Item>
                                            ) as ReactElement)
                                        ) : (
                                            <SimpleGrid.Item col={1}>
                                              <div
                                                  style={{
                                                    flexDirection: "column",
                                                    justifyContent: "space-between",
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    alignSelf: "stretch",
                                                    height: "100%",
                                                  }}
                                              >
                                        <span
                                            style={{
                                              color:
                                              theme.colors.orderSecondary
                                                  .orderSecondary100,
                                              ...theme.fonts.h1500,
                                              marginBottom: "8px",
                                            }}
                                        >
                                          {verifactuSiSelected ? (
                                              <>
                                                {
                                                  configTranslation("verifactu_section.verified_config.description.selected_yes_verifactu")
                                                }{" "}
                                                <a
                                                    target="blank"
                                                    style={{
                                                      color: theme.colors.orderSecondary.orderSecondary100
                                                    }}
                                                    href={
                                                        stelUrl +
                                                        `/#deepLink=verifactu`
                                                    }
                                                >
                                                  STEL Order
                                                </a>
                                              </>
                                          ) : verifactuNoSelected ? (
                                              <>
                                                {
                                                  configTranslation("verifactu_section.verified_config.description.selected_no_verifactu")
                                                }{" "}
                                                <a
                                                    target="blank"
                                                    href={
                                                        stelUrl +
                                                        `/#deepLink=verifactu`
                                                    }
                                                >
                                                  STEL Order
                                                </a>
                                              </>
                                          ) : (
                                              "Selecciona tu opción Verifactu"
                                          )}
                                        </span>
                                                <SimpleGrid gap={18} itemsPerLine={2}>
                                                  <SimpleGrid.Item col={1}>
                                                    <SelectCard
                                                        selected={verifactuSiSelected}
                                                        disabled={true}
                                                    >
                                                      <SelectCard.Title>
                                                        {
                                                          configTranslation("verifactu_section.verified_config.yes_option.title")
                                                        }
                                                      </SelectCard.Title>
                                                      <SelectCard.Text>
                                                        {
                                                          configTranslation("verifactu_section.verified_config.yes_option.text_1")
                                                        }
                                                        <br />
                                                        <br />
                                                        {
                                                          configTranslation("verifactu_section.verified_config.yes_option.text_2")
                                                        }
                                                      </SelectCard.Text>
                                                    </SelectCard>
                                                  </SimpleGrid.Item>
                                                  <SimpleGrid.Item col={1}>
                                                    <SelectCard
                                                        selected={verifactuNoSelected}
                                                        disabled={true}
                                                    >
                                                      <SelectCard.Title>
                                                        {
                                                          configTranslation("verifactu_section.verified_config.no_option.title")
                                                        }
                                                      </SelectCard.Title>
                                                      <SelectCard.Text>
                                                        {
                                                          configTranslation("verifactu_section.verified_config.no_option.text_1")
                                                        }
                                                        <br />
                                                        <br />
                                                        {
                                                          configTranslation("verifactu_section.verified_config.no_option.text_2")
                                                        }
                                                      </SelectCard.Text>
                                                    </SelectCard>
                                                  </SimpleGrid.Item>
                                                </SimpleGrid>
                                              </div>
                                            </SimpleGrid.Item>
                                        )}
                                      </>
                                      <>
                                        {verifactuEstado === "pendiente"
                                            ? ((
                                                <SimpleGrid.Item col={1}>
                                                  <div
                                                      style={{
                                                        marginRight: "12px",
                                                      }}
                                                  >
                                                    <SimpleGrid
                                                        gap={22}
                                                        itemsPerLine={2}
                                                        htmlProps={{
                                                          style: {
                                                            padding: "20px 0 16px 12px",
                                                            justifyContent: "flex-end",
                                                            alignItems: "center",
                                                            alignSelf: "stretch",
                                                          },
                                                        }}
                                                    >
                                                      <SimpleGrid.Item
                                                          align="stretch"
                                                          htmlProps={{
                                                            style: { flex: "0 0 auto" },
                                                          }}
                                                      >
                                                        <LogoAgencia
                                                            style={{
                                                              width: "89px",
                                                              height: "auto",
                                                            }}
                                                        />
                                                      </SimpleGrid.Item>

                                                      <SimpleGrid.Item
                                                          htmlProps={{
                                                            style: { flex: "1 0 0" },
                                                          }}
                                                      >
                                                        <SimpleGrid
                                                            gap={10}
                                                            htmlProps={{
                                                              style: {
                                                                paddingTop: "10px",
                                                              },
                                                            }}
                                                        >
                                                          <SimpleGrid.Item>
                                                            <div
                                                                style={{
                                                                  boxSizing: "border-box",
                                                                  marginRight: 12, // asegura el mismo padding visual dentro de esta columna
                                                                }}
                                                            >
                                                      <span
                                                          style={{
                                                            display: "block",
                                                            color:
                                                            theme.colors
                                                                .orderSecondary
                                                                .orderSecondary70,
                                                            ...theme.fonts.h1500,
                                                          }}
                                                      >
                                                        {
                                                          configTranslation("verifactu_section.config_card.text")
                                                        }
                                                      </span>
                                                            </div>
                                                          </SimpleGrid.Item>
                                                          <SimpleGrid.Item>
                                                            <Button
                                                                variant="gray"
                                                                size="m"
                                                                htmlProps={{
                                                                  as: "a",
                                                                  href: `${stelUrl}/#deepLink=verifactu`,
                                                                  target: "_blank",
                                                                }}
                                                            >
                                                              {
                                                                configTranslation("verifactu_section.config_card.button")
                                                              }
                                                            </Button>
                                                          </SimpleGrid.Item>
                                                        </SimpleGrid>
                                                      </SimpleGrid.Item>
                                                    </SimpleGrid>
                                                    <Card
                                                        htmlProps={{
                                                          style: {
                                                            padding: "14px",
                                                            boxSizing: "border-box",
                                                          },
                                                        }}
                                                    >
                                                      <SimpleGrid
                                                          gap={12}
                                                          wrap={false}
                                                          htmlProps={{
                                                            style: {
                                                              paddingBottom: "10px",
                                                              justifyContent: "flex-end",
                                                              alignItems: "center",
                                                              alignSelf: "stretch",
                                                              textAlign: "left",
                                                            },
                                                          }}
                                                      >
                                                        <Image
                                                            style={{
                                                              borderRadius: "50%",
                                                            }}
                                                            alt="Alejandra"
                                                            src={getBaseUrl(
                                                                LogoAlejandra
                                                            )}
                                                        />

                                                        <span
                                                            style={{
                                                              display: "block",
                                                              color:
                                                              theme.colors
                                                                  .orderSecondary
                                                                  .orderSecondary80,
                                                              ...theme.fonts.h1400,
                                                            }}
                                                        >
                                                  {
                                                    configTranslation("verifactu_section.help_card.text")
                                                  }
                                                </span>
                                                      </SimpleGrid>
                                                      <Button
                                                          variant="secondary"
                                                          size="xl"
                                                          htmlProps={{
                                                            as: "a",
                                                            href: `${stelUrl}/#deepLink=helpCenter`,
                                                            target: "_blank",
                                                          }}
                                                      >
                                                        {
                                                          configTranslation("verifactu_section.help_card.button")
                                                        }
                                                      </Button>
                                                    </Card>
                                                  </div>
                                                </SimpleGrid.Item>
                                            ) as ReactElement)
                                            : null}
                                      </>
                                    </SimpleGrid>
                                ) as ReactElement)
                                : null}
                          </>
                          <>
                            {verifactuEstado === "aceptada"
                                ? ((
                                    <SimpleGrid.Item col={2}>
                                      <SimpleGrid itemsPerLine={2} gap={20}>
                                        <SimpleGrid.Item col={1}>
                                          <Form.Group
                                              htmlProps={{
                                                style: { textAlign: "left" },
                                              }}
                                          >
                                            <Form.Label
                                                htmlProps={{
                                                  htmlFor: "sendVerifactu",
                                                  style: {
                                                    textAlign: "left",
                                                    color:
                                                    theme.colors.orderSecondary
                                                        .orderSecondary80,
                                                  },
                                                }}
                                            >
                                              {
                                                configTranslation("verifactu_section.verified_config.auto_verifactu.title")
                                              }
                                            </Form.Label>
                                            <Form.Select
                                                optionValue={
                                                  data?.integrationConfig?.verifactu_config
                                                      ?.is_active
                                                      ? {
                                                        label:
                                                            configTranslation("verifactu_section.verified_config.auto_verifactu.yes"),
                                                        value: "true",
                                                      }
                                                      : {
                                                        label:
                                                            configTranslation("verifactu_section.verified_config.auto_verifactu.no"),
                                                        value: "false",
                                                      }
                                                }
                                                handleChange={(option) => {
                                                  handleData((prev) => {
                                                    if (!prev) return prev;
                                                    return {
                                                      ...prev,
                                                      integrationConfig: {
                                                        ...prev.integrationConfig,
                                                        verifactu_config: {
                                                          ...prev.integrationConfig
                                                              .verifactu_config,
                                                          is_active: JSON.parse(
                                                              option.value
                                                          ),
                                                        },
                                                      },
                                                    };
                                                  });
                                                }}
                                                htmlProps={{
                                                  disabled: isDisabled,
                                                  id: "sendVerifactu",
                                                  name: "sendVerifactu",
                                                  style: {
                                                    textAlign: "left",
                                                    boxSizing: "border-box",
                                                  },
                                                }}
                                                options={[
                                                  {
                                                    label:
                                                        configTranslation("verifactu_section.verified_config.auto_verifactu.no"),
                                                    value: "false",
                                                  },

                                                  {
                                                    label:
                                                        configTranslation("verifactu_section.verified_config.auto_verifactu.yes"),
                                                    value: "true",
                                                  },
                                                ]}
                                            />
                                          </Form.Group>
                                        </SimpleGrid.Item>
                                      </SimpleGrid>
                                    </SimpleGrid.Item>
                                ) as ReactElement)
                                : null}
                          </>
                        </SimpleGrid>
                      </SimpleGrid.Item>
                      <SimpleGrid.Item col={1}>
                        <SimpleGrid gap={8} itemsPerLine={2} direction="row">
                          <SimpleGrid.Item col={2}>
                            <Title
                                htmlProps={{ as: "h1" }}
                                textAlign="left"
                                variant="default"
                            >
                              {
                                configTranslation("other_settings_section.title")
                              }
                            </Title>
                          </SimpleGrid.Item>

                          <SimpleGrid.Item col={2}>
                            <SimpleGrid itemsPerLine={2} gap={20}>
                              <SimpleGrid.Item col={1}>
                                <Form.Group
                                    htmlProps={{
                                      style: { textAlign: "left" },
                                    }}
                                >
                                  <Form.Label
                                      htmlProps={{
                                        htmlFor: "refClient",
                                        style: {
                                          textAlign: "left",
                                          color:
                                          theme.colors.orderSecondary.orderSecondary80,
                                        },
                                      }}
                                  >
                                    {
                                      configTranslation("other_settings_section.client_ref")
                                    }
                                  </Form.Label>
                                  <Form.Select
                                      defaultOption={
                                          (defaultSnOptions.defaultOptionClientsn as SelectOption) || {
                                            label: "Por defecto",
                                            value: "",
                                          }
                                      }
                                      optionValue={refClient}
                                      handleChange={(opt) => {
                                        handleData((prev) => {
                                          if (!prev) return prev;
                                          setRefClient(opt);
                                          return {
                                            ...prev,
                                            integrationConfig: {
                                              ...prev.integrationConfig,
                                              client_config: {
                                                ...prev.integrationConfig
                                                    .client_config,
                                                serial_number_client_id : Number(opt.value) || null,
                                              },
                                            },
                                          }
                                        })}}
                                      htmlProps={{
                                        disabled: isDisabled,
                                        id: "refClient",
                                        name: "refClient",
                                        style: {
                                          textAlign: "left",
                                        },
                                      }}
                                      options={[
                                        ...(SerialNumberUtils.mapSnOptions(
                                            data?.availableIntegrationConfig
                                                .available_client_config.clientSerialNumbers
                                        ) || []),
                                      ]}
                                  />
                                </Form.Group>
                              </SimpleGrid.Item>
                              <SimpleGrid.Item col={1}>
                                <Form.Group
                                    htmlProps={{
                                      style: { textAlign: "left" },
                                    }}
                                >
                                  <Form.Label
                                      htmlProps={{
                                        htmlFor: "refProduct",
                                        style: {
                                          textAlign: "left",
                                          color:
                                          theme.colors.orderSecondary.orderSecondary80,
                                        },
                                      }}
                                  >
                                    {
                                      configTranslation("other_settings_section.product_ref")
                                    }
                                  </Form.Label>
                                  <Form.Select
                                      defaultOption={
                                          (defaultSnOptions.defaultOptionProductsn as SelectOption) || {
                                            label: "Por defecto",
                                            value: "",
                                          }
                                      }
                                      optionValue={refProduct}
                                      handleChange={(opt) => {
                                        handleData((prev) => {
                                          if (!prev) return prev;
                                          setRefProduct(opt);
                                          return {
                                            ...prev,
                                            integrationConfig: {
                                              ...prev.integrationConfig,
                                              product_config: {
                                                ...prev.integrationConfig
                                                    .product_config,
                                                serial_number_product_id : Number(opt.value) || null,
                                              },
                                            },
                                          }
                                        })}}
                                      htmlProps={{
                                        disabled: isDisabled,
                                        id: "refProduct",
                                        name: "refProduct",
                                        style: {
                                          textAlign: "left",
                                        },
                                      }}
                                      options={[
                                        ...(SerialNumberUtils.mapSnOptions(
                                            data?.availableIntegrationConfig
                                                .available_product_config.productSerialNumbers
                                        ) || []),
                                      ]}
                                  />
                                </Form.Group>
                              </SimpleGrid.Item>
                            </SimpleGrid>
                          </SimpleGrid.Item>
                          <SimpleGrid.Item col={2}>
                            <SimpleGrid itemsPerLine={2} gap={20}>
                              <SimpleGrid.Item col={1}>
                                <Form.Group
                                    htmlProps={{
                                      style: { textAlign: "left" },
                                    }}
                                >
                                  <Form.Label
                                      htmlProps={{
                                        htmlFor: "warehouse",
                                        style: {
                                          textAlign: "left",
                                          color:
                                          theme.colors.orderSecondary.orderSecondary80,
                                        },
                                      }}
                                  >
                                    {
                                      configTranslation("other_settings_section.warehouse")
                                    }
                                  </Form.Label>
                                  <Form.Select
                                      defaultOption={
                                          defaultOptionWarehouse || {
                                            label: configTranslation("other_settings_section.warehouse_placeholder"),
                                            value: "",
                                          }
                                      }
                                      optionValue={warehouse}
                                      handleChange={(opt) => {
                                        handleData((prev) => {
                                          if (!prev) return prev;
                                          setRefWarehouse(opt);
                                          return {
                                            ...prev,
                                            integrationConfig: {
                                              ...prev.integrationConfig,
                                              warehouse_config: {
                                                warehouse_id : opt.value || "",
                                              },
                                            },
                                          }
                                        });
                                      }}
                                      htmlProps={{
                                        disabled: isDisabled,
                                        id: "warehouse",
                                        name: "warehouse",
                                        style: {
                                          textAlign: "left",
                                        },
                                      }}
                                      options={[
                                        ...(data?.availableIntegrationConfig?.available_warehouse_config?.warehouses?.map(
                                            (wh) => ({
                                              label: wh.name,
                                              value: wh.id,
                                            })
                                        ) || []),
                                      ]}
                                  />
                                </Form.Group>
                              </SimpleGrid.Item>
                            </SimpleGrid>
                          </SimpleGrid.Item>
                        </SimpleGrid>
                      </SimpleGrid.Item>
                    </SimpleGrid>
                  </Card>
                </SimpleGrid.Item>
              </SimpleGrid>
            </Form>
        )}
        <SelectSyncStatusModal
            title={configTranslation("modal_select_state.order_title")}
            close={() => setOpenSalesOrderStateModal(false)}
            statuses={
                data?.integrationConfig?.sales_order_config?.sales_order_statuses ||
                []
            }
            isOpen={openSalesOrderStateModal}
            availableStatuses={
                data?.availableIntegrationConfig.available_sales_order_config
                    .salesOrderStatuses || {}
            }
            submitStatuses={(selectedStatuses) => {
              handleData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  integrationConfig: {
                    ...prev.integrationConfig,
                    sales_order_config: {
                      ...prev.integrationConfig.sales_order_config,
                      sales_order_statuses: selectedStatuses,
                    },
                  },
                };
              });
            }}
        />
        <SelectSyncStatusModal
            title={
              configTranslation("modal_select_state.invoice_title")
            }
            close={() => setOpenOrdinaryInvoiceStateModal(false)}
            statuses={
                data?.integrationConfig?.ordinary_invoice_config
                    ?.ordinary_invoice_statuses || []
            }
            isOpen={openOrdinaryInvoiceStateModal}
            availableStatuses={
                data?.availableIntegrationConfig.available_ordinary_invoice_config
                    .ordinaryInvoiceStatuses || {}
            }
            submitStatuses={(selectedStatuses) => {
              handleData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  integrationConfig: {
                    ...prev.integrationConfig,
                    ordinary_invoice_config: {
                      ...prev.integrationConfig.ordinary_invoice_config,
                      ordinary_invoice_statuses: selectedStatuses,
                    },
                  },
                };
              });
            }}
        />
        <ErrorModal
            isOpen={openErrorModal}
            close={() => setOpenErrorModal(false)}
            message={errorTranslation("modal_error.message1")}
            durationMs={2500}
        />
        <Modal
            isOpen={open}
            isCentered={true}
            fade={false}
            animationDurationSec={0.3}
            showIn={root}
            htmlProps={{ as: "section" }}
        >
          <SimpleGrid direction="column" gap={24} alignY="center">
            <SimpleGrid.Item>
              <Icon
                  variant="success"
                  width="46px"
                  height="46px"
                  color={theme.colors.bn.bn0}
              />
            </SimpleGrid.Item>
            <SimpleGrid.Item
                htmlProps={{
                  as: "h1",
                  style: { flex: "1 0 0", textWrap: "wrap", margin: 0 },
                  className: "modal-title",
                }}
            >
              {configTranslation("modal_save")}
            </SimpleGrid.Item>
          </SimpleGrid>
        </Modal>
      </>
  );
}

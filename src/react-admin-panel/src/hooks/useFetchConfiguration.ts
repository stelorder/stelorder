import { API_URL } from "../config/SyncNameConfig";
import { useForm } from "./useFormWebhooks";

// Tipos auxiliares
export type SerialNumber = {
  id: number | string;
  name: string;
  prefix: string;
  default: boolean;
};

export type Warehouse = {
  id: string;
  name: string;
};

// Configuración principal de integración
export type IntegrationConfig = {
  integration_id: string;
  integration_status: string;
  document_config: {
    default_client_id: number;
    invoice_location: string;
  };
  product_config: {
    serial_number_product_id: number | null;
  };
  sales_order_config: {
    sync: boolean;
    serial_number_sales_order_id: number | null;
    sales_order_statuses: string[];
  };
  ordinary_invoice_config: {
    sync: boolean;
    ordinary_invoice_statuses: string[];
    serial_number_ordinary_invoice_id: number | null;
  };
  refund_invoice_config: {
    serial_number_refund_invoice_id: number | null;
    default_product_refund_id: string | null;
  };
  client_config: {
    serial_number_client_id: number | null;
  };
  warehouse_config: {
    warehouse_id: string;
  };
  verifactu_config: {
    check_verifactu: boolean;
    is_active: boolean;
  };
  integration_module_config: IntegrationModuleConfig[]
};

export interface IntegrationModuleConfig {
    module_name: string;
}

export interface Integration360ModuleConfig extends IntegrationModuleConfig {
  warehouse_config: { warehouse_id: string };
  product_360_config: {
      sync: boolean;
      fields: { field_rule: string, direction: "TO_PRIMARY" | "TO_SECONDARY" | "BIDIRECTIONAL" }[];
  };
}

export function isIntegration360ModuleConfig(config: IntegrationModuleConfig): config is Integration360ModuleConfig {
    return (config as Integration360ModuleConfig).product_360_config !== undefined && config.module_name === "360";
}

// Configuración disponible
export type AvailableIntegrationConfig = {
  available_document_config: {
    invoiceLocation: string[];
  };
  available_sales_order_config: {
    salesOrderSerialNumbers: SerialNumber[];
    salesOrderStatuses: Record<string, string>;
  };
  available_ordinary_invoice_config: {
    ordinaryInvoiceStatuses: Record<string, string>;
    ordinaryInvoiceSerialNumbers: SerialNumber[];
  };
  available_product_config: {
    productSerialNumbers: SerialNumber[];
  };
  available_client_config: {
    clientSerialNumbers: SerialNumber[];
  };
  available_refund_invoice_config: {
    refundInvoiceSerialNumbers: SerialNumber[];
  };
  available_warehouse_config: {
    warehouses: Warehouse[];
  };
  available_integration_module_config: IntegrationModuleConfigAvailable[];
};

export interface IntegrationModuleConfigAvailable {
    module_name: string;
}

export interface Integration360ModuleConfigAvailable extends IntegrationModuleConfigAvailable {
    warehouses: Warehouse[];
}

export function isIntegration360ModuleConfigAvailable(config: IntegrationModuleConfigAvailable): config is Integration360ModuleConfigAvailable {
    return config.module_name === "360";
}

// Configuración de sincronización de órdenes
type LegacyOrderSyncSubscription = {
  sync: boolean;
  fields: unknown | null;
  name: string;
  id: string;
};

type VerifactuConfig = {
  "verifactu-enabled": boolean;
  "no-verifactu-enabled": boolean;
  "yes-verifactu-enabled": boolean;
}

// Tipo raíz
export type RootConfig = {
  integrationConfig: IntegrationConfig;
  availableIntegrationConfig: AvailableIntegrationConfig;
  legacyOrderSyncSubscription: LegacyOrderSyncSubscription;
  verifactuConfig: VerifactuConfig;
};



export function useFetchConfiguration({
  handleData,
  onError,
}: {
  handleData: (dataValue: RootConfig | null) => void;
  onError?: () => void;
}) {
  const { handleSubmit } = useForm({
    endpoint: `${API_URL}/integrations/configurations`,
    method: "GET",
    onComplete: (data) => {
      handleData(data as RootConfig);
    },
    onError: (error) => {
      handleData(null);

      if (onError) onError();
      console.error("Error fetching integration config:", error);
    },
  });

  return {
    fetchIntegrationData: () => {
      handleSubmit();
    },
  };
}

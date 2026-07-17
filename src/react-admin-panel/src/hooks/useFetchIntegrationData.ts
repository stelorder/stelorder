import { API_URL } from "../config/SyncNameConfig";
import { useForm } from "./useFormWebhooks";

interface MonthlyRecord {
  [month: string]: {
    amount: number;
    total: number;
  };
}

export type IntegrationData = {
  "integration-status": string;
  "subscription-status": string;
  "sync-orders": boolean;
  "sync-invoices": boolean;
  "sync-refund-invoices": boolean;
  totals: {
    PRODUCT: number;
    SALESORDER: MonthlyRecord[];
    ORDINARYINVOICE: MonthlyRecord[];
    REFUNDINVOICE: MonthlyRecord[];
    CLIENT: number;
  };
  plan: string;
  "integration-enabled": boolean;
}


export function useFetchIntegrationData({
    handleData,
    onError
}: { handleData: (dataValue: IntegrationData | null) => void, onError?: () => void }) {

    const { handleSubmit } = useForm({
        endpoint: `${API_URL}/integrations/summary`,
        method: "GET",
        onComplete: (data) => {
            handleData(data as IntegrationData);
        },
        onError: (error) => {
            handleData(null)
            
            if (onError)
              onError();
            console.error("Error fetching integration data:", error);
        }
    });

    return {
        fetchIntegrationData: () => {
            handleSubmit();
        }
    };
}
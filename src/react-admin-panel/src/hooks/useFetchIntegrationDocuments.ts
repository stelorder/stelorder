import { API_URL } from "../config/SyncNameConfig";
import { useForm } from "./useFormWebhooks";

export type Document = {
  ["full-reference"]: string;
  title: string;
  customer: string;
  ["creation-date"]: string;
  ["total-amount"]: number;
  ["document-state-id"]: number;
  type: string;
  verifactuState?: string;
};

export type DocumentState = {
  color: string;
  name: string;
  id: number;
  order: number;
  type?: string;
};

export type IntegrationDocuments = {
  documents: Document[];
  documentStates: DocumentState[];
};

export function useFetchIntegrationDocuments({
  handleData,
  onError,
}: {
  handleData: (dataValue: IntegrationDocuments | null) => void, onError?: () => void;
}) {
  const { handleSubmit } = useForm({
    endpoint: `${API_URL}/integrations/documents`,
    method: "GET",
    onComplete: (data: {
      documents: Record<string, string>[];
      ["document-states"]: Record<string, string>[];
    }) => {
      handleData({
        documents:
          data?.documents?.map((item) => ({
            "full-reference": item["full-reference"] ?? "",
            "customer": item["customer"] ?? "",
            title: item.title ?? "",
            "creation-date": item["creation-date"] ?? "",
            "total-amount": Number(item["total-amount"] ?? 0),
            "document-state-id": Number(item["document-state-id"] ?? 0),
            type: item.type ?? "",
            verifactuState: item.verifactuState ?? undefined,
          })) ?? [],
        documentStates:
          data?.["document-states"]?.map((state) => ({
            color: state.color ?? "",
            name: state.name ?? "",
            order: Number(state.order ?? 0),
            id: Number(state.id ?? 0),
            type: state.type ?? "",
          })) ?? [],
      });
    },
    onError: (error) => {
      handleData(null);
      if (onError) onError();
      console.error("Error fetching integration data:", error);
    },
  });

  return {
    fetchIntegrationDocuments: () => {
      handleSubmit();
    },
  };
}

import { useMemo } from "react";
import { API_URL } from "../config/SyncNameConfig";
import { PaginatedResult } from "../utils/types";
import { DocumentState } from "./useFetchIntegrationDocuments";
import { useCreateFetchResources } from "./useCreateFetchResources";

export type InvoiceData = {
  id: string;
  externalId: string;
  documentStateId: string;
  resourceId?: string;
  fullReference?: string;
  customer: string;
  date: string;
  verifactuState: string;
  verifactuResults: string;
  totalAmount: string;
};

export type PaginatedInvoicesResult = {
    paginatedResult: PaginatedResult<InvoiceData>;
    documentStates: DocumentState[];
};


function getTemplateUrl({ API_URL, firstElement, pageSize }: { API_URL: string; firstElement: number; pageSize: number; }) {
    return `${API_URL}/integrations/invoices?firstElement=${firstElement}&pageSize=${pageSize}`;
}

export function useFetchInvoices({
  firstElement = 0,
  pageSize = 5,
  handleData,
  onError,
}: {
  firstElement?: number;
  pageSize?: number;
  handleData: (dataValue: PaginatedInvoicesResult | null) => void;
  onError?: () => void;
}) {
  const endpoint = useMemo(() => {
    return getTemplateUrl({ API_URL, firstElement, pageSize });
  }, [firstElement, pageSize]);
  const method = "GET";

  const fetchResources = useCreateFetchResources<PaginatedInvoicesResult>({
    endpoint,
    method,
    handleData,
    onError,
  });


  return {
    fetchInvoicesData: fetchResources.fetchResourceData,
    fetchPaginatedInvoicesData: ({firstElement, pageSize}: {firstElement: number; pageSize: number}) => {
      const paginatedEndpoint = getTemplateUrl({ API_URL, firstElement, pageSize });
      return fetchResources.fetchData({
        endpoint: paginatedEndpoint,
        method,
      });
    },
  };
}
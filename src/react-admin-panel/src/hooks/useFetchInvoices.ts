import {useMemo} from "react";
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


function getTemplateUrl({ API_URL, firstElement, pageSize, ...queryVars }: { API_URL: string; firstElement: number; pageSize: number; } & Record<string, unknown>) {
    return `${API_URL}/integrations/invoices?firstElement=${firstElement}&pageSize=${pageSize}${
      Object.entries(queryVars || {})
          .filter(([, value]) => value !== undefined && value !== null)
          .filter(([, value]) => Boolean(String(value).trim()) )
          .map(([key, value]) => `&${key}=${String(value).trim()}`)
          .join("")
    }`;
}

export function useFetchInvoices({
  firstElement = 0,
  pageSize = 5,
  handleData,
  onError,
  sortColumn,
  sortDirection,
  searchReference
}: {
  firstElement?: number;
  pageSize?: number;
  handleData: (dataValue: PaginatedInvoicesResult | null) => void;
  onError?: () => void;
  sortColumn?: 'reference' | 'creation-date' | 'document-state-id',
  sortDirection?: 'asc' | 'desc',
  searchReference?: string,
}) {
  const endpoint = useMemo(() => {
    return getTemplateUrl({ API_URL, firstElement, pageSize, sortBy: sortColumn, sortDirection, reference: searchReference });
  }, [firstElement, pageSize, sortColumn, sortDirection, searchReference]);
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
      const paginatedEndpoint = getTemplateUrl({ API_URL, firstElement, pageSize, sortBy: sortColumn, sortDirection, reference: searchReference });
      return fetchResources.fetchData({
        endpoint: paginatedEndpoint,
        method,
      });
    },
  };
}
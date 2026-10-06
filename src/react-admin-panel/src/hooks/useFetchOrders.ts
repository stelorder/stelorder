import { useMemo } from "react";
import { PaginatedResult } from "../utils/types";
import { DocumentState } from "./useFetchIntegrationDocuments";
import { API_URL } from "../config/SyncNameConfig";
import { useCreateFetchResources } from "./useCreateFetchResources";

export type OrderData = {
  id: string;
  externalId: string;
  resourceId?: string;
  documentStateId: string;
  fullReference?: string;
  customer: string;
  date: string;
  totalAmount: string;
};

export type PaginatedOrdersResult = {
  paginatedResult: PaginatedResult<OrderData>;
  documentStates: DocumentState[];
};

function getTemplateUrl({
  API_URL,
  firstElement,
  pageSize,
  ...queryVars
}: {
  API_URL: string;
  firstElement: number;
  pageSize: number;
} & Record<string, unknown>) {
  return `${API_URL}/integrations/orders?firstElement=${firstElement}&pageSize=${pageSize}${
    Object.entries(queryVars || {})
        .filter(([, value]) => value !== undefined && value !== null)
        .filter(([, value]) => Boolean(String(value).trim()) )
        .map(([key, value]) => `&${key}=${String(value).trim()}`)
      .join("")
  }`;
}

export function useFetchOrders({
  firstElement = 0,
  pageSize = 5,
  handleData,
  onError,
  sortColumn,
  sortDirection,
  searchReference,
}: {
  firstElement?: number;
  pageSize?: number;
  handleData: (dataValue: PaginatedOrdersResult | null) => void;
  onError?: () => void;
  sortColumn?: "reference" | "creation-date" | "document-status-id";
  sortDirection?: "asc" | "desc";
  searchReference?: string;
}) {
  const endpoint = useMemo(() => {
    return getTemplateUrl({
      API_URL,
      firstElement,
      pageSize,
      sortBy: sortColumn,
      sortDirection,
      reference: searchReference,
    });
  }, [firstElement, pageSize, sortColumn, sortDirection, searchReference]);
  const method = "GET";

  const fetchResources = useCreateFetchResources<PaginatedOrdersResult>({
    endpoint,
    method,
    handleData,
    onError,
  });

  return {
    fetchOrdersData: fetchResources.fetchResourceData,
    fetchPaginatedOrdersData: ({firstElement, pageSize}: {firstElement: number; pageSize: number}) => {
      const paginatedEndpoint = getTemplateUrl({
        API_URL,
        firstElement,
        pageSize,
        sortBy: sortColumn,
        sortDirection,
        reference: searchReference,
      });
      return fetchResources.fetchData({
        endpoint: paginatedEndpoint,
        method,
      });
    }
  };
}

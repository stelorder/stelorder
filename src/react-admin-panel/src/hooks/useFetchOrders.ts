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
}: {
  API_URL: string;
  firstElement: number;
  pageSize: number;
}) {
  return `${API_URL}/integrations/orders?firstElement=${firstElement}&pageSize=${pageSize}`;
}

export function useFetchOrders({
  firstElement = 0,
  pageSize = 5,
  handleData,
  onError,
}: {
  firstElement?: number;
  pageSize?: number;
  handleData: (dataValue: PaginatedOrdersResult | null) => void;
  onError?: () => void;
}) {
  const endpoint = useMemo(() => {
    return getTemplateUrl({ API_URL, firstElement, pageSize });
  }, [firstElement, pageSize]);
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
      const paginatedEndpoint = getTemplateUrl({ API_URL, firstElement, pageSize });
      return fetchResources.fetchData({
        endpoint: paginatedEndpoint,
        method,
      });
    }
  };
}

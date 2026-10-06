import { useMemo } from "react";
import { PaginatedResult } from "../utils/types";
import { API_URL } from "../config/SyncNameConfig";
import { useCreateFetchResources } from "./useCreateFetchResources";
import {
  EventType,
  EventAction,
  EventStatus,
  SubjobType, EventDirection,
} from "../utils/eventEnums";

type EventData = {
  type: EventType;
  action: EventAction;
  direction?: EventDirection;
  status: EventStatus;
  subjobs?: Partial<Record<SubjobType, number>>;
  reason?: string;
  creationDateTime: string;
  entityId: string;
};

export type HistoryResult = {
    paginatedResult: PaginatedResult<EventData>;
};

function getTemplateUrl({ API_URL, firstElement, pageSize, ...params }: { API_URL: string; firstElement: number; pageSize: number; } & Record<string, unknown>) {
    return `${API_URL}/events?firstElement=${firstElement}&pageSize=${pageSize}${
        Object.entries(params || {})
            .filter(([, value]) => value !== undefined && value !== null)
            .filter(([, value]) => Boolean(String(value).trim()) )
            .map(([key, value]) => `&${key}=${value}`)
            .join("")
      }`;
}

export function useFetchHistory({
  firstElement = 0,
  pageSize = 5,
  handleData,
  onError,
  sortColumn,
  sortDirection,
}: {
  firstElement?: number;
  pageSize?: number;
  handleData: (dataValue: HistoryResult | null) => void;
  onError?: () => void;
  sortColumn?: 'creationDateTime' | 'direction' | 'status';
  sortDirection?: 'asc' | 'desc';
}) {
  const endpoint = useMemo(() => {
    return getTemplateUrl({ API_URL, firstElement, pageSize, sortBy: sortColumn, sortDirection });
  }, [firstElement, pageSize, sortColumn, sortDirection]);
  const method = "GET";

  const fetchResources = useCreateFetchResources<HistoryResult>({
    endpoint,
    method,
    handleData,
    onError,
  });


  return {
    fetchHistoryData: fetchResources.fetchResourceData,
    fetchPaginatedHistoryData: ({firstElement, pageSize}: {firstElement: number; pageSize: number}) => {
      const paginatedEndpoint = getTemplateUrl({ API_URL, firstElement, pageSize, sortBy: sortColumn, sortDirection });
      return fetchResources.fetchData({
        endpoint: paginatedEndpoint,
        method,
      });
    },
  };
}
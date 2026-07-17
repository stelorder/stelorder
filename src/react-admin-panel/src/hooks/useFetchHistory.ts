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
};

export type HistoryResult = {
    paginatedResult: PaginatedResult<EventData>;
};

function getTemplateUrl({ API_URL, firstElement, pageSize }: { API_URL: string; firstElement: number; pageSize: number; }) {
    return `${API_URL}/events?firstElement=${firstElement}&pageSize=${pageSize}`;
}

export function useFetchHistory({
  firstElement = 0,
  pageSize = 5,
  handleData,
  onError,
}: {
  firstElement?: number;
  pageSize?: number;
  handleData: (dataValue: HistoryResult | null) => void;
  onError?: () => void;
}) {
  const endpoint = useMemo(() => {
    return getTemplateUrl({ API_URL, firstElement, pageSize });
  }, [firstElement, pageSize]);
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
      const paginatedEndpoint = getTemplateUrl({ API_URL, firstElement, pageSize });
      return fetchResources.fetchData({
        endpoint: paginatedEndpoint,
        method,
      });
    },
  };
}